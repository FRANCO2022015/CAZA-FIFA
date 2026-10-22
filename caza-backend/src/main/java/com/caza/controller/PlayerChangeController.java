package com.caza.controller;
import com.caza.dto.response.ApiResponse;
import com.caza.model.User;
import com.caza.service.impl.PlayerChangeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/player-change-requests") @RequiredArgsConstructor
public class PlayerChangeController {
    private final PlayerChangeService service;
    public record Proposal(@NotBlank String game,@NotNull @Positive Long playerId, @Positive Long statsId,
        @NotEmpty @Size(max=12) Map<@NotBlank String,@NotNull @Size(max=500) String> changes,
        @NotBlank @Size(min=5,max=1000) String reason) {}
    public record Decision(@NotNull Boolean approve,@Size(max=1000) String note) {}
    @PostMapping public ApiResponse<?> create(@AuthenticationPrincipal User user,@Valid @RequestBody Proposal body) {
        return ApiResponse.success(service.create(user,body.game(),body.playerId(),body.statsId(),body.changes(),body.reason()));
    }
    @GetMapping public ApiResponse<?> list(@AuthenticationPrincipal User user,@RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page) {
        return ApiResponse.success(service.list(user,status,page));
    }
    @GetMapping("/pending-count") public ApiResponse<?> count(@AuthenticationPrincipal User user){return ApiResponse.success(service.pending(user));}
    @PostMapping("/{id}/resolve") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<?> resolve(@PathVariable Long id,@AuthenticationPrincipal User user,@Valid @RequestBody Decision body) {
        return ApiResponse.success(service.resolve(id,user,body.approve(),body.note()));
    }
}
