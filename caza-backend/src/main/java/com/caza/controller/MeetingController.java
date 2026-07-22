package com.caza.controller;

import com.caza.dto.request.MeetingRequest;
import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.MeetingResponse;
import com.caza.model.User;
import com.caza.service.interfaces.MeetingService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Meetings", description = "Virtual meeting endpoints")
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping
    public ResponseEntity<ApiResponse<MeetingResponse>> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody MeetingRequest request) {
        MeetingResponse response = meetingService.createMeeting(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Reunión creada", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MeetingResponse>>> getMeetings(@AuthenticationPrincipal User user) {
        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        List<MeetingResponse> meetings = isAdmin
                ? meetingService.getAllMeetings()
                : meetingService.getUserMeetings(user.getId());
        return ResponseEntity.ok(ApiResponse.success(meetings));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        meetingService.deleteMeeting(id, user.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Reunión eliminada", null));
    }
}
