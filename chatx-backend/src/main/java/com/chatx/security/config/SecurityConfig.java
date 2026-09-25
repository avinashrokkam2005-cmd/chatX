package com.chatx.security.config;

import com.chatx.security.jwt.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    Map<String, Object> body = Map.of(
                            "success", false,
                            "message", "Full authentication is required to access this resource",
                            "errorCode", "UNAUTHORIZED",
                            "timestamp", Instant.now().toString()
                    );
                    new ObjectMapper().writeValue(response.getOutputStream(), body);
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    Map<String, Object> body = Map.of(
                            "success", false,
                            "message", "You do not have permission to access this resource",
                            "errorCode", "FORBIDDEN",
                            "timestamp", Instant.now().toString()
                    );
                    new ObjectMapper().writeValue(response.getOutputStream(), body);
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/files/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
