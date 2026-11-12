package com.hashicorp.poc.core.servlets;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.Servlet;
import javax.servlet.http.HttpServletResponse;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletResourceTypes;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hashicorp.poc.core.services.DiscountResult;
import com.hashicorp.poc.core.services.DiscountService;

/**
 * Read-only JSON endpoint for the discount proof of concept:
 * {@code GET /content/hashicorp-poc-api/discount.calculate.json?amount=6000}.
 * Registered by resource type, so it only answers on the API resource that ui.content installs.
 * Validates the amount, delegates the calculation to {@link DiscountService} and returns JSON.
 * Responses are per-request and must never be cached by the Dispatcher or the CDN.
 */
@Component(service = Servlet.class)
@SlingServletResourceTypes(
        resourceTypes = ProofServlet.RESOURCE_TYPE,
        methods = HttpConstants.METHOD_GET,
        selectors = "calculate",
        extensions = "json")
public class ProofServlet extends SlingSafeMethodsServlet {

    static final String RESOURCE_TYPE = "hashicorp-poc/components/discount-api";
    static final String PARAM_AMOUNT = "amount";
    /** Upper bound that keeps the demo endpoint from processing absurd inputs. */
    static final BigDecimal MAX_AMOUNT = new BigDecimal("1000000000");

    private static final long serialVersionUID = 1L;
    private static final Logger LOG = LoggerFactory.getLogger(ProofServlet.class);
    private static final ObjectMapper JSON = new ObjectMapper()
            .configure(JsonGenerator.Feature.WRITE_BIGDECIMAL_AS_PLAIN, true);

    @Reference
    private transient DiscountService discountService;

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        // Results depend on the query: keep them out of shared caches and vary by origin for CORS
        response.setHeader("Cache-Control", "no-store, private");
        response.setHeader("Vary", "Origin");
        response.setHeader("X-Content-Type-Options", "nosniff");

        String raw = request.getParameter(PARAM_AMOUNT);
        BigDecimal amount;
        try {
            amount = parseAmount(raw);
        } catch (IllegalArgumentException e) {
            writeError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
            return;
        }

        try {
            DiscountResult result = discountService.calculate(amount);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", true);
            body.put("orderAmount", plain(result.getOrderAmount()));
            body.put("discountPercentage", result.getDiscountPercentage());
            body.put("discountAmount", plain(result.getDiscountAmount()));
            body.put("finalAmount", plain(result.getFinalAmount()));
            body.put("message", result.getMessage());
            response.setStatus(HttpServletResponse.SC_OK);
            JSON.writeValue(response.getWriter(), body);
        } catch (IllegalArgumentException e) {
            writeError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (RuntimeException e) {
            LOG.error("Discount calculation failed for amount {}", amount, e);
            writeError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "The discount could not be calculated");
        }
    }

    /** Parses and validates the amount query parameter; the message explains what is wrong. */
    static BigDecimal parseAmount(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            throw new IllegalArgumentException("The amount query parameter is required");
        }
        BigDecimal amount;
        try {
            amount = new BigDecimal(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("The amount must be a number, for example 6000 or 1234.50");
        }
        if (amount.signum() < 0) {
            throw new IllegalArgumentException("The amount must not be negative");
        }
        if (amount.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("The amount must have at most two decimal places");
        }
        if (amount.compareTo(MAX_AMOUNT) > 0) {
            throw new IllegalArgumentException("The amount must not exceed " + MAX_AMOUNT.toPlainString());
        }
        return amount;
    }

    /** 6000.00 is written as 6000 and 1234.50 as 1234.5: same value, no trailing zeros. */
    private static BigDecimal plain(BigDecimal value) {
        BigDecimal stripped = value.stripTrailingZeros();
        return stripped.scale() < 0 ? stripped.setScale(0) : stripped;
    }

    private static void writeError(SlingHttpServletResponse response, int status, String message) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("error", message);
        response.setStatus(status);
        JSON.writeValue(response.getWriter(), body);
    }
}
