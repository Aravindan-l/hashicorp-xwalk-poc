package com.hashicorp.poc.core.services.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import com.hashicorp.poc.core.services.DiscountResult;

class DiscountServiceImplTest {

    private final DiscountServiceImpl service = new DiscountServiceImpl();

    @ParameterizedTest(name = "{0} -> {1}%")
    @CsvSource({
        "0, 0",
        "999.99, 0",
        "1000, 5",
        "1000.00, 5",
        "4999.99, 5",
        "5000, 10",
        "9999.99, 10",
        "10000, 15",
        "250000, 15",
    })
    void appliesTheTierForEachThreshold(String amount, int expectedPercentage) {
        assertEquals(expectedPercentage, service.calculate(new BigDecimal(amount)).getDiscountPercentage());
    }

    @Test
    void calculatesTheSpecExample() {
        DiscountResult result = service.calculate(new BigDecimal("6000"));
        assertEquals(10, result.getDiscountPercentage());
        assertEquals(new BigDecimal("6000.00"), result.getOrderAmount());
        assertEquals(new BigDecimal("600.00"), result.getDiscountAmount());
        assertEquals(new BigDecimal("5400.00"), result.getFinalAmount());
        assertEquals("You are eligible for a 10% discount", result.getMessage());
    }

    @Test
    void roundsTheDiscountHalfUpToCents() {
        // 1234.57 x 5 % = 61.7285 -> 61.73
        DiscountResult result = service.calculate(new BigDecimal("1234.57"));
        assertEquals(new BigDecimal("61.73"), result.getDiscountAmount());
        assertEquals(new BigDecimal("1172.84"), result.getFinalAmount());
    }

    @ParameterizedTest
    @CsvSource({ "1000.01", "4999.99", "5000.05", "9999.99", "12345.67", "0.01" })
    void discountAndFinalAmountAlwaysAddUpToTheOrder(String amount) {
        DiscountResult result = service.calculate(new BigDecimal(amount));
        assertEquals(result.getOrderAmount(), result.getDiscountAmount().add(result.getFinalAmount()));
        assertEquals(2, result.getDiscountAmount().scale());
        assertEquals(2, result.getFinalAmount().scale());
    }

    @Test
    void ordersBelowTheFirstTierGetNoDiscount() {
        DiscountResult result = service.calculate(new BigDecimal("999.99"));
        assertEquals(new BigDecimal("0.00"), result.getDiscountAmount());
        assertEquals(new BigDecimal("999.99"), result.getFinalAmount());
        assertEquals("Orders below 1000 are not eligible for a discount", result.getMessage());
    }

    @Test
    void rejectsAMissingAmount() {
        assertThrows(IllegalArgumentException.class, () -> service.calculate(null));
    }

    @Test
    void rejectsANegativeAmount() {
        assertThrows(IllegalArgumentException.class, () -> service.calculate(new BigDecimal("-0.01")));
    }

    @Test
    void rejectsFractionsOfACent() {
        assertThrows(IllegalArgumentException.class, () -> service.calculate(new BigDecimal("100.001")));
    }
}
