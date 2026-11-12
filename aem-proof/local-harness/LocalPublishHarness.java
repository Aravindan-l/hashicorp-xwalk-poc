import com.hashicorp.poc.core.services.impl.DiscountServiceImpl;
import com.hashicorp.poc.core.servlets.ProofServlet;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * LOCAL DEVELOPMENT ONLY - never deployed.
 *
 * Stands in for an AEM SDK publish instance when none is available, so the Edge Delivery block can
 * be tried in the local preview. It runs the real compiled ProofServlet and DiscountServiceImpl
 * (core/target/classes): the HTTP request is adapted to a SlingHttpServletRequest, the servlet's
 * own doGet produces the response. No business logic lives here.
 *
 * It mimics the dev CORS policy (config.publish.dev) by allowing http://localhost:3000 only.
 *
 * Run from migration-work/aem-proof after "mvn package":
 *   java -cp "core/target/classes:<aem-sdk-api.jar>:<jackson jars>" local-harness/LocalPublishHarness.java
 */
public class LocalPublishHarness {

    private static final String PATH = "/content/hashicorp-poc-api/discount.calculate.json";
    private static final String ALLOWED_ORIGIN = "http://localhost:3000";

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 4503;
        ProofServlet servlet = new ProofServlet();
        Field ref = ProofServlet.class.getDeclaredField("discountService");
        ref.setAccessible(true);
        ref.set(servlet, new DiscountServiceImpl());
        Method doGet = ProofServlet.class.getDeclaredMethod("doGet",
                org.apache.sling.api.SlingHttpServletRequest.class, org.apache.sling.api.SlingHttpServletResponse.class);
        doGet.setAccessible(true);

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/", exchange -> {
            try (exchange) {
                String origin = exchange.getRequestHeaders().getFirst("Origin");
                if (ALLOWED_ORIGIN.equals(origin)) {
                    exchange.getResponseHeaders().set("Access-Control-Allow-Origin", origin);
                }
                if (!"GET".equals(exchange.getRequestMethod()) || !PATH.equals(exchange.getRequestURI().getPath())) {
                    exchange.sendResponseHeaders(404, -1);
                    return;
                }
                handle(servlet, doGet, exchange);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        server.start();
        System.out.println("Local publish harness on http://localhost:" + port + PATH);
    }

    private static void handle(ProofServlet servlet, Method doGet, HttpExchange exchange) throws Exception {
        Map<String, String> params = query(exchange.getRequestURI().getRawQuery());
        StringWriter body = new StringWriter();
        PrintWriter writer = new PrintWriter(body);
        int[] status = {200};

        Object request = Proxy.newProxyInstance(LocalPublishHarness.class.getClassLoader(),
                new Class<?>[] {org.apache.sling.api.SlingHttpServletRequest.class},
                (p, m, a) -> "getParameter".equals(m.getName()) ? params.get((String) a[0]) : null);
        Object response = Proxy.newProxyInstance(LocalPublishHarness.class.getClassLoader(),
                new Class<?>[] {org.apache.sling.api.SlingHttpServletResponse.class},
                (p, m, a) -> {
                    switch (m.getName()) {
                        case "getWriter": return writer;
                        case "setStatus": status[0] = (Integer) a[0]; return null;
                        case "setHeader":
                            exchange.getResponseHeaders().set((String) a[0], (String) a[1]);
                            return null;
                        case "setContentType":
                            exchange.getResponseHeaders().set("Content-Type", a[0] + ";charset=UTF-8");
                            return null;
                        default: return null;
                    }
                });

        doGet.invoke(servlet, request, response);
        writer.flush();
        byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status[0], bytes.length);
        exchange.getResponseBody().write(bytes);
        System.out.println(status[0] + " amount=" + params.get("amount") + " -> " + body);
    }

    private static Map<String, String> query(String raw) {
        Map<String, String> result = new HashMap<>();
        if (raw == null) return result;
        for (String pair : raw.split("&")) {
            int eq = pair.indexOf('=');
            String key = URLDecoder.decode(eq < 0 ? pair : pair.substring(0, eq), StandardCharsets.UTF_8);
            String value = eq < 0 ? "" : URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            result.putIfAbsent(key, value);
        }
        return result;
    }
}
