package com.caza.controller;

import com.caza.dto.request.ForumPostRequest;
import com.caza.dto.request.ForumThreadRequest;
import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.ForumPostResponse;
import com.caza.dto.response.ForumThreadResponse;
import com.caza.dto.response.PagedResponse;
import com.caza.model.User;
import com.caza.service.interfaces.ForumService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
@Tag(name = "Forum", description = "Forum threads and posts endpoints")
public class ForumController {

    private final ForumService forumService;

    @GetMapping("/threads")
    public ResponseEntity<ApiResponse<PagedResponse<ForumThreadResponse>>> getThreads(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(forumService.getAllThreads(page, size)));
    }

    @GetMapping("/threads/{id}")
    public ResponseEntity<ApiResponse<ForumThreadResponse>> getThread(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(forumService.getThreadById(id)));
    }

    @PostMapping("/threads")
    public ResponseEntity<ApiResponse<ForumThreadResponse>> createThread(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ForumThreadRequest request) {
        ForumThreadResponse response = forumService.createThread(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Hilo creado", response));
    }

    @DeleteMapping("/threads/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteThread(
            @AuthenticationPrincipal User user, @PathVariable Long id) {
        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        forumService.deleteThread(id, user.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Hilo eliminado", null));
    }

    @GetMapping("/threads/{threadId}/posts")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> getPosts(@PathVariable Long threadId) {
        return ResponseEntity.ok(ApiResponse.success(forumService.getPostsByThread(threadId)));
    }

    @PostMapping("/threads/{threadId}/posts")
    public ResponseEntity<ApiResponse<ForumPostResponse>> addPost(
            @AuthenticationPrincipal User user,
            @PathVariable Long threadId,
            @Valid @RequestBody ForumPostRequest request) {
        ForumPostResponse response = forumService.createPost(threadId, user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Post publicado", response));
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<ForumPostResponse>> updatePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @Valid @RequestBody ForumPostRequest request) {
        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(ApiResponse.success("Post actualizado", forumService.updatePost(postId, user.getId(), isAdmin, request)));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @AuthenticationPrincipal User user, @PathVariable Long postId) {
        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        forumService.deletePost(postId, user.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Post eliminado", null));
    }
}
