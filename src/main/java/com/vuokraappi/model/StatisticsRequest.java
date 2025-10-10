package com.vuokraappi.model;

import java.util.List;

public class StatisticsRequest {
    private String type;
    private List<String> zipCodes;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List<String> getZipCodes() {
        return zipCodes;
    }

    public void setZipCodes(List<String> zipCodes) {
        this.zipCodes = zipCodes;
    }
}
