package com.hashicorp.poc.core.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.osgi.service.component.annotations.Component;

import com.hashicorp.poc.core.services.DiscountResult;
import com.hashicorp.poc.core.services.DiscountService;

/**
 * Discount tiers by order amount:
 * below 1000: 0 %, 1000 to 4999.99: 5 %, 5000 to 9999.99: 10 %, 10000 and above: 15 %.
 * The discount is rounded half-up to two decimal places; the final amount is the order amount
 * less the discount, so the two always add up to the order amount.
 */
@Component(service = DiscountService.class)
public class DiscountServiceImpl implements DiscountService {

    private static final int SCALE = 2;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal TIER_5 = new BigDecimal("1000");
    private static final BigDecimal TIER_10 = new BigDecimal("5000");
    private static final BigDecimal TIER_15 = new BigDecimal("10000");

    @Override
    public DiscountResult calculate(BigDecimal orderAmount) {
        if (orderAmount == null) {
            throw new IllegalArgumentException("Order amount is required");
        }
        if (orderAmount.signum() < 0) {
            throw new IllegalArgumentException("Order amount must not be negative");
        }
        if (orderAmount.stripTrailingZeros().scale() > SCALE) {
            throw new IllegalArgumentException("Order amount must have at most two decimal places");
        }

        BigDecimal amount = orderAmount.setScale(SCALE, RoundingMode.UNNECESSARY);
        int percentage = percentageFor(amount);
        BigDecimal discount = amount.multiply(BigDecimal.valueOf(percentage))
                .divide(HUNDRED, SCALE, RoundingMode.HALF_UP);
        BigDecimal finalAmount = amount.subtract(discount);
        return new DiscountResult(amount, percentage, discount, finalAmount, messageFor(percentage));
    }

    static int percentageFor(BigDecimal amount) {
        if (amount.compareTo(TIER_15) >= 0) {
            return 15;
        }
        if (amount.compareTo(TIER_10) >= 0) {
            return 10;
        }
        if (amount.compareTo(TIER_5) >= 0) {
            return 5;
        }
        return 0;
    }

    private static String messageFor(int percentage) {
        if (percentage == 0) {
            return "Orders below 1000 are not eligible for a discount";
        }
        return "You are eligible for a " + percentage + "% discount";
    }
}
