package com.hashicorp.poc.core.services;

import java.math.BigDecimal;

/**
 * Result of a discount calculation. Monetary values are BigDecimal with two decimal places.
 */
public final class DiscountResult {

    private final BigDecimal orderAmount;
    private final int discountPercentage;
    private final BigDecimal discountAmount;
    private final BigDecimal finalAmount;
    private final String message;

    public DiscountResult(BigDecimal orderAmount, int discountPercentage, BigDecimal discountAmount,
            BigDecimal finalAmount, String message) {
        this.orderAmount = orderAmount;
        this.discountPercentage = discountPercentage;
        this.discountAmount = discountAmount;
        this.finalAmount = finalAmount;
        this.message = message;
    }

    public BigDecimal getOrderAmount() {
        return orderAmount;
    }

    public int getDiscountPercentage() {
        return discountPercentage;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public String getMessage() {
        return message;
    }
}
