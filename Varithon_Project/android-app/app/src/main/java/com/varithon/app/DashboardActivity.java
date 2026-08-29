package com.varithon.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.varithon.app.api.ApiService;
import com.varithon.app.model.ApiResponse;
import com.varithon.app.model.User;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class DashboardActivity extends AppCompatActivity {
    private TextView tvRoleTitle;
    private LinearLayout layoutContent;
    private Button btnLogout;
    private ApiService apiService;
    private SharedPreferences prefs;
    private User currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        prefs = getSharedPreferences("varkari_mitra", MODE_PRIVATE);
        String token = prefs.getString("token", null);
        if (token == null) {
            finish();
            return;
        }

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(ApiService.BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        apiService = retrofit.create(ApiService.class);

        tvRoleTitle = findViewById(R.id.tvRoleTitle);
        layoutContent = findViewById(R.id.layoutContent);
        btnLogout = findViewById(R.id.btnLogout);

        btnLogout.setOnClickListener(v -> {
            prefs.edit().clear().apply();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
        });

        loadUser();
    }

    private void loadUser() {
        String token = prefs.getString("token", null);
        apiService.me("Bearer " + token).enqueue(new Callback<ApiResponse<User>>() {
            @Override
            public void onResponse(Call<ApiResponse<User>> call, Response<ApiResponse<User>> response) {
                if (response.isSuccessful() && response.body() != null && "ok".equals(response.body().getStatus())) {
                    currentUser = response.body().getData();
                    renderDashboard();
                } else {
                    Toast.makeText(DashboardActivity.this, "Session expired", Toast.LENGTH_SHORT).show();
                    prefs.edit().clear().apply();
                    startActivity(new Intent(DashboardActivity.this, LoginActivity.class));
                    finish();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<User>> call, Throwable t) {
                Toast.makeText(DashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void renderDashboard() {
        if (currentUser == null) return;

        String role = currentUser.getRole();
        if (role == null) role = "varkari";

        switch (role) {
            case "varkari":
                tvRoleTitle.setText("🙏 Varkari Dashboard");
                renderVarkariDashboard();
                break;
            case "varkari_mitra":
                tvRoleTitle.setText("🤝 Varkari Mitra Dashboard");
                renderMitraDashboard();
                break;
            case "vari_sevak":
                tvRoleTitle.setText("🛕 Vari Sevak Dashboard");
                renderSevakDashboard();
                break;
            default:
                tvRoleTitle.setText("Dashboard");
                renderVarkariDashboard();
                break;
        }
    }

    private void renderVarkariDashboard() {
        layoutContent.removeAllViews();
        layoutContent.setOrientation(LinearLayout.VERTICAL);
        layoutContent.setGravity(android.view.Gravity.CENTER_HORIZONTAL);

        TextView tv = new TextView(this);
        tv.setText("Namaste, " + currentUser.getName());
        tv.setTextColor(getResources().getColor(R.color.text_primary));
        tv.setTextSize(18);
        tv.setPadding(0, 0, 0, 24);
        layoutContent.addView(tv);

        addCard("📍 My Location", "Share your current location with family members", R.drawable.ic_dialog_info);
        addCard("👨‍👩‍👧 Family Members", "Add and manage family members", R.drawable.ic_dialog_info);
        addCard("🔍 Family View", "Let family members view your location", R.drawable.ic_dialog_info);
        addCard("📊 Account Info", "Role: Varkari\nEmail: " + currentUser.getEmail() + "\nID: " + currentUser.getId(), R.drawable.ic_dialog_info);
    }

    private void renderMitraDashboard() {
        layoutContent.removeAllViews();
        layoutContent.setOrientation(LinearLayout.VERTICAL);
        layoutContent.setGravity(android.view.Gravity.CENTER_HORIZONTAL);

        TextView tv = new TextView(this);
        tv.setText("Welcome, " + currentUser.getName());
        tv.setTextColor(getResources().getColor(R.color.text_primary));
        tv.setTextSize(18);
        tv.setPadding(0, 0, 0, 24);
        layoutContent.addView(tv);

        if (!"VERIFIED".equals(currentUser.getKycStatus())) {
            addCard("🔐 eKYC Verification", "Complete eKYC to start reporting incidents", R.drawable.ic_dialog_info);
        } else {
            addCard("📢 Report Incident", "Report road blocks, accidents, or emergencies", R.drawable.ic_dialog_info);
            addCard("📋 Recent Reports", "View your recent incident reports", R.drawable.ic_dialog_info);
        }

        addCard("👤 Profile", "Role: Varkari Mitra\nEmail: " + currentUser.getEmail() + "\nKYC: " + currentUser.getKycStatus(), R.drawable.ic_dialog_info);
    }

    private void renderSevakDashboard() {
        layoutContent.removeAllViews();
        layoutContent.setOrientation(LinearLayout.VERTICAL);
        layoutContent.setGravity(android.view.Gravity.CENTER_HORIZONTAL);

        TextView tv = new TextView(this);
        tv.setText("Seva Parmarth, " + currentUser.getName());
        tv.setTextColor(getResources().getColor(R.color.text_primary));
        tv.setTextSize(18);
        tv.setPadding(0, 0, 0, 24);
        layoutContent.addView(tv);

        addCard("➕ Create New Seva", "Add seva services to the marketplace", R.drawable.ic_dialog_info);
        addCard("📋 My Sevas", "Manage your seva listings", R.drawable.ic_dialog_info);
        addCard("🌐 Seva Marketplace", "Browse all available sevas", R.drawable.ic_dialog_info);
        addCard("👤 Profile", "Role: Vari Sevak\nEmail: " + currentUser.getEmail() + "\nID: " + currentUser.getId(), R.drawable.ic_dialog_info);
    }

    private void addCard(String title, String desc, int icon) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundColor(getResources().getColor(R.color.surface));
        card.setPadding(20, 20, 20, 20);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 0, 0, 16);
        card.setLayoutParams(params);

        TextView tvTitle = new TextView(this);
        tvTitle.setText(title);
        tvTitle.setTextColor(getResources().getColor(R.color.text_primary));
        tvTitle.setTextSize(16);
        tvTitle.setPadding(0, 0, 0, 8);
        card.addView(tvTitle);

        TextView tvDesc = new TextView(this);
        tvDesc.setText(desc);
        tvDesc.setTextColor(getResources().getColor(R.color.text_secondary));
        tvDesc.setTextSize(13);
        card.addView(tvDesc);

        layoutContent.addView(card);
    }
}
