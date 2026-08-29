package com.varithon.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.varithon.app.api.ApiService;
import com.varithon.app.model.AuthResponse;
import com.varithon.app.model.User;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class LoginActivity extends AppCompatActivity {
    private EditText etEmail, etPassword, etName;
    private Button btnSubmit, btnToggle;
    private RadioGroup rgRole;
    private LinearLayout layoutRegister;
    private TextView tvError, tvSubtitle, tvEkycHint;
    private boolean isRegister = false;
    private ApiService apiService;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        prefs = getSharedPreferences("varkari_mitra", MODE_PRIVATE);
        String token = prefs.getString("token", null);
        if (token != null) {
            startActivity(new Intent(this, DashboardActivity.class));
            finish();
            return;
        }

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(ApiService.BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        apiService = retrofit.create(ApiService.class);

        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        etName = findViewById(R.id.etName);
        btnSubmit = findViewById(R.id.btnSubmit);
        btnToggle = findViewById(R.id.btnToggle);
        rgRole = findViewById(R.id.rgRole);
        layoutRegister = findViewById(R.id.layoutRegister);
        tvError = findViewById(R.id.tvError);
        tvSubtitle = findViewById(R.id.tvSubtitle);
        tvEkycHint = findViewById(R.id.tvEkycHint);

        rgRole.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == R.id.rbMitra) {
                tvEkycHint.setVisibility(View.VISIBLE);
            } else {
                tvEkycHint.setVisibility(View.GONE);
            }
        });

        btnToggle.setOnClickListener(v -> toggleMode());
        btnSubmit.setOnClickListener(v -> handleSubmit());
    }

    private void toggleMode() {
        isRegister = !isRegister;
        if (isRegister) {
            layoutRegister.setVisibility(View.VISIBLE);
            tvSubtitle.setText("Create Account");
            btnSubmit.setText("Register");
            btnToggle.setText("Already have an account? Login");
        } else {
            layoutRegister.setVisibility(View.GONE);
            tvSubtitle.setText("Welcome Back");
            btnSubmit.setText("Login");
            btnToggle.setText("Don't have an account? Register");
        }
        tvError.setVisibility(View.GONE);
    }

    private void handleSubmit() {
        String email = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            tvError.setText("Email and password required");
            tvError.setVisibility(View.VISIBLE);
            return;
        }

        tvError.setVisibility(View.GONE);
        btnSubmit.setEnabled(false);

        if (isRegister) {
            String name = etName.getText().toString().trim();
            String role = getSelectedRole();
            User user = new User();
            user.setEmail(email);
            user.setPassword(password);
            user.setName(name);
            user.setRole(role);

            apiService.register(user).enqueue(new Callback<AuthResponse>() {
                @Override
                public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                    btnSubmit.setEnabled(true);
                    if (response.isSuccessful() && response.body() != null) {
                        saveToken(response.body().getToken());
                        goToDashboard();
                    } else {
                        showError("Registration failed: " + (response.message() != null ? response.message() : "Unknown error"));
                    }
                }

                @Override
                public void onFailure(Call<AuthResponse> call, Throwable t) {
                    btnSubmit.setEnabled(true);
                    showError("Network error: " + t.getMessage());
                }
            });
        } else {
            ApiService.LoginRequest req = new ApiService.LoginRequest();
            req.email = email;
            req.password = password;

            apiService.login(req).enqueue(new Callback<AuthResponse>() {
                @Override
                public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                    btnSubmit.setEnabled(true);
                    if (response.isSuccessful() && response.body() != null) {
                        saveToken(response.body().getToken());
                        goToDashboard();
                    } else {
                        showError("Invalid email or password");
                    }
                }

                @Override
                public void onFailure(Call<AuthResponse> call, Throwable t) {
                    btnSubmit.setEnabled(true);
                    showError("Network error: " + t.getMessage());
                }
            });
        }
    }

    private String getSelectedRole() {
        int checkedId = rgRole.getCheckedRadioButtonId();
        if (checkedId == R.id.rbMitra) return "varkari_mitra";
        if (checkedId == R.id.rbSevak) return "vari_sevak";
        return "varkari";
    }

    private void saveToken(String token) {
        prefs.edit().putString("token", token).apply();
    }

    private void goToDashboard() {
        startActivity(new Intent(this, DashboardActivity.class));
        finish();
    }

    private void showError(String msg) {
        tvError.setText(msg);
        tvError.setVisibility(View.VISIBLE);
    }
}
