package com.vuokraappi.model;

import java.util.List;

public class MultiStatisticsRequest {
    private List<String> types;
    private List<String> postalCodes;

    public List<String> getTypes() { return types; }
    public void setTypes(List<String> types) { this.types = types; }

    public List<String> getPostalCodes() { return postalCodes; }
    public void setPostalCodes(List<String> postalCodes) { this.postalCodes = postalCodes; }
}
