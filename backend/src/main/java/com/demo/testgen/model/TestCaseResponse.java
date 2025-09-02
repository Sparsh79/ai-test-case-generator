package com.demo.testgen.model;

public class TestCaseResponse {
    private boolean success;
    private String message;
    private String testCases;

    public TestCaseResponse() {}

    public TestCaseResponse(boolean success, String message, String testCases) {
        this.success = success;
        this.message = message;
        this.testCases = testCases;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTestCases() {
        return testCases;
    }

    public void setTestCases(String testCases) {
        this.testCases = testCases;
    }
}