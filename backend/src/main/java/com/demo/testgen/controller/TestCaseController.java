package com.demo.testgen.controller;

import com.demo.testgen.model.TestCaseRequest;
import com.demo.testgen.model.TestCaseResponse;
import com.demo.testgen.service.TestCaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TestCaseController {

    @Autowired
    private TestCaseService testCaseService;

    @PostMapping("/generate-testcases")
    public ResponseEntity<TestCaseResponse> generateTestCases(@RequestBody TestCaseRequest request) {
        try {
            String generatedTestCases = testCaseService.generateTestCases(request.getPrompt());
            TestCaseResponse response = new TestCaseResponse();
            response.setSuccess(true);
            response.setTestCases(generatedTestCases);
            response.setMessage("Test cases generated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            TestCaseResponse response = new TestCaseResponse();
            response.setSuccess(false);
            response.setMessage("Error generating test cases: " + e.getMessage());
            response.setTestCases("Failed to generate test cases. Please try again.");
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Service is running!");
    }
}