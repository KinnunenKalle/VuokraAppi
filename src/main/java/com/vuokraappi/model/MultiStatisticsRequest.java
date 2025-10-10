package com.vuokraappi.model;

import java.util.List;

public class MultiStatisticsRequest {
    private List<String> types;
    private List<String> zipCodes;

    public List<String> getTypes() { return types; }
    public void setTypes(List<String> types) { this.types = types; }

    public List<String> getZipCodes() { return zipCodes; }
    public void setZipCodes(List<String> zipCodes) { this.zipCodes = zipCodes; }
}
