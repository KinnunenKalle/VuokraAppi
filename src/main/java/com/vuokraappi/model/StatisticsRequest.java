package com.vuokraappi.model;

import java.util.List;

public class StatisticsRequest {
    private String type;
    private List<String> postalCodes;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<String> getPostalCodes() {
        return postalCodes;
    }

    public void setPostalCodes(List<String> postalCodes) {
        this.postalCodes = postalCodes;
    }
}
