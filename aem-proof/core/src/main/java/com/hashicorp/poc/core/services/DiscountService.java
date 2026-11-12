package com.hashicorp.poc.core.services;

import java.math.BigDecimal;

/**
 * Calculates the discount that applies to an order amount.
 */
public interface DiscountService {

    /**
     * @param orderAmount order amount, zero or more, with at most two decimal places
     * @return the discount tier, discount amount and final amount for the order
     * @throws IllegalArgumentException when the amount is missing, negative or has more than two decimal places
     */
    DiscountResult calculate(BigDecimal orderAmount);
}
