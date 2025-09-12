package com.demo.testgen.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class TestCaseService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String generateTestCases(String prompt) {
        try {
            // Debug logging
            System.out.println("DEBUG: API Key starts with: " + (groqApiKey != null ? groqApiKey.substring(0, Math.min(10, groqApiKey.length())) + "..." : "null"));
            System.out.println("DEBUG: API URL: " + groqApiUrl);

            // Create the request payload for Groq API
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "meta-llama/llama-4-scout-17b-16e-instruct"); // Using a known working model
            requestBody.put("max_tokens", 2000);
            requestBody.put("temperature", 0.7);

            List<Map<String, String>> messages = new ArrayList<>();

            // System message to define the AI's role
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are an expert software test engineer with over 10 years of experience. Generate comprehensive, well-structured test cases based on the given requirements or user stories. Include positive test cases, negative test cases, edge cases, and boundary value testing scenarios.\n\nFormat EACH test case as a separate, clearly defined block using the following structure:\n\n=== TEST CASE [ID] ===\nTitle: [Brief descriptive title]\nDescription: [Detailed description]\nPreconditions: [Required setup/conditions]\nTest Steps:\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\nExpected Results: [What should happen]\nPriority: [High/Medium/Low]\nCategory: [Functional/Security/Performance/UI/etc.]\n\n=== END TEST CASE ===\n\nMake sure each test case is clearly separated and covers different scenarios including security, performance, and usability aspects where relevant.");

            // User message with the actual prompt
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", "Generate detailed test cases for the following requirement: " + prompt);

            messages.add(systemMessage);
            messages.add(userMessage);
            requestBody.put("messages", messages);

            // Set headers for Groq API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Debug: Check if API key is being set correctly
            if (groqApiKey == null || groqApiKey.equals("your-groq-api-key")) {
                return "ERROR: API key not configured properly. Current value: " + groqApiKey;
            }

            headers.setBearerAuth(groqApiKey);

            // Debug: Print headers (without full API key)
            System.out.println("DEBUG: Authorization header set: " + headers.containsKey("Authorization"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Make API call to Groq
            ResponseEntity<String> response = restTemplate.exchange(
                    groqApiUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                // Parse the response
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                JsonNode choices = jsonResponse.get("choices");

                if (choices != null && choices.isArray() && choices.size() > 0) {
                    JsonNode firstChoice = choices.get(0);
                    JsonNode message = firstChoice.get("message");
                    if (message != null) {
                        JsonNode content = message.get("content");
                        if (content != null) {
                            return content.asText();
                        }
                    }
                }
            }

            return "Failed to generate test cases. HTTP Status: " + response.getStatusCode();

        } catch (Exception e) {
            e.printStackTrace();
            return "Error occurred while generating test cases: " + e.getMessage() +
                    "\n\nDEBUG INFO:" +
                    "\nAPI Key configured: " + (groqApiKey != null && !groqApiKey.equals("your-groq-api-key")) +
                    "\nAPI Key starts with: " + (groqApiKey != null ? groqApiKey.substring(0, Math.min(4, groqApiKey.length())) + "..." : "null") +
                    "\nNote: Please ensure your Groq API key is properly configured in the environment variables.";
        }
    }
}