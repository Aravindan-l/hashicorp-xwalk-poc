package com.hashicorp.poc.core.servlets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.Map;

import org.apache.sling.testing.mock.sling.servlet.MockSlingHttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hashicorp.poc.core.services.DiscountService;
import com.hashicorp.poc.core.services.impl.DiscountServiceImpl;

import io.wcm.testing.mock.aem.junit5.AemContext;
import io.wcm.testing.mock.aem.junit5.AemContextExtension;

@ExtendWith(AemContextExtension.class)
class ProofServletTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final AemContext context = new AemContext();

    private MockSlingHttpServletResponse call(DiscountService service, String amount) throws IOException {
        context.registerService(DiscountService.class, service);
        ProofServlet servlet = context.registerInjectActivateService(new ProofServlet());
        if (amount != null) {
            context.request().setParameterMap(Map.of(ProofServlet.PARAM_AMOUNT, amount));
        }
        servlet.doGet(context.request(), context.response());
        return context.response();
    }

    private static JsonNode body(MockSlingHttpServletResponse response) throws IOException {
        return JSON.readTree(response.getOutputAsString());
    }

    @Test
    void returnsTheCalculatedDiscountAsJson() throws IOException {
        MockSlingHttpServletResponse response = call(new DiscountServiceImpl(), "6000");

        assertEquals(200, response.getStatus());
        assertTrue(response.getContentType().startsWith("application/json"));
        JsonNode json = body(response);
        assertTrue(json.get("success").asBoolean());
        assertEquals(6000, json.get("orderAmount").asInt());
        assertEquals(10, json.get("discountPercentage").asInt());
        assertEquals(600, json.get("discountAmount").asInt());
        assertEquals(5400, json.get("finalAmount").asInt());
        assertEquals("You are eligible for a 10% discount", json.get("message").asText());
    }

    @Test
    void writesMoneyAsPlainNumbers() throws IOException {
        JsonNode json = body(call(new DiscountServiceImpl(), "1234.57"));
        assertEquals("61.73", json.get("discountAmount").asText());
        assertEquals("1172.84", json.get("finalAmount").asText());
        assertTrue(json.get("discountAmount").isNumber());
    }

    @Test
    void keepsResponsesOutOfSharedCaches() throws IOException {
        MockSlingHttpServletResponse response = call(new DiscountServiceImpl(), "6000");
        assertEquals("no-store, private", response.getHeader("Cache-Control"));
        assertEquals("Origin", response.getHeader("Vary"));
    }

    @Test
    void rejectsAMissingAmount() throws IOException {
        MockSlingHttpServletResponse response = call(new DiscountServiceImpl(), null);
        assertEquals(400, response.getStatus());
        JsonNode json = body(response);
        assertFalse(json.get("success").asBoolean());
        assertEquals("The amount query parameter is required", json.get("error").asText());
    }

    @ParameterizedTest
    @ValueSource(strings = { "abc", "12,5", "-1", "-0.01", "100.001", "2000000000", " " })
    void rejectsInvalidAmountsWithBadRequest(String amount) throws IOException {
        MockSlingHttpServletResponse response = call(new DiscountServiceImpl(), amount);
        assertEquals(400, response.getStatus());
        JsonNode json = body(response);
        assertFalse(json.get("success").asBoolean());
        assertFalse(json.get("error").asText().isEmpty());
    }

    @Test
    void reportsServiceFailuresAsServerErrorsWithoutDetails() throws IOException {
        DiscountService failing = amount -> {
            throw new IllegalStateException("database down");
        };

        MockSlingHttpServletResponse response = call(failing, "6000");
        assertEquals(500, response.getStatus());
        JsonNode json = body(response);
        assertFalse(json.get("success").asBoolean());
        assertEquals("The discount could not be calculated", json.get("error").asText());
    }
}
