package com.caza.service.interfaces;

import com.caza.dto.request.LoginRequest;
import com.caza.dto.request.RegisterRequest;
import com.caza.dto.response.AuthResponse;
import com.caza.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String correo);
}
