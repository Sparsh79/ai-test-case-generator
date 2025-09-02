package com.demo.testgen.model;

public class TestCaseRequest {
    private String prompt;

    public TestCaseRequest() {}

    public TestCaseRequest(String prompt) {
        this.prompt = prompt;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }
}