package com.varithon.app.api;

import com.varithon.app.model.AuthResponse;
import com.varithon.app.model.ApiResponse;
import com.varithon.app.model.User;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface ApiService {
    String BASE_URL = "https://varithon-backend.onrender.com/api/";

    @POST("auth/register")
    Call<AuthResponse> register(@Body User user);

    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest request);

    @POST("auth/google")
    Call<AuthResponse> googleLogin(@Body GoogleLoginRequest request);

    @GET("auth/me")
    Call<ApiResponse<User>> me(@Header("Authorization") String token);

    @POST("kyc/ekyc")
    Call<ApiResponse<User>> ekyc(@Header("Authorization") String token, @Body EkycRequest request);

    @POST("varkari/location")
    Call<ApiResponse<User>> updateLocation(@Header("Authorization") String token, @Body LocationRequest request);

    @PUT("varkari/sharing")
    Call<ApiResponse<User>> setSharing(@Header("Authorization") String token, @Body SharingRequest request);

    @POST("family/add")
    Call<ApiResponse<Object>> addFamily(@Header("Authorization") String token, @Body FamilyRequest request);

    @GET("family/mine")
    Call<ApiResponse<java.util.List>> myFamily(@Header("Authorization") String token);

    @GET("family/track/{varkariId}")
    Call<ApiResponse<Object>> trackVarkari(@Header("Authorization") String token, @Path("varkariId") String varkariId);

    @POST("sevas/create")
    Call<ApiResponse<Object>> createSeva(@Header("Authorization") String token, @Body SevaRequest request);

    @GET("sevas")
    Call<ApiResponse<java.util.List>> allSevas();

    @GET("sevas/mine")
    Call<ApiResponse<java.util.List>> mySevas(@Header("Authorization") String token);

    class LoginRequest {
        public String email;
        public String password;
    }

    class GoogleLoginRequest {
        public String email;
        public String name;
        public String googleId;
        public String role;
    }

    class EkycRequest {
        public String fullName;
        public String aadhaarNumber;
        public String address;
        public String phone;
        public String photoBase64;
    }

    class LocationRequest {
        public double latitude;
        public double longitude;
    }

    class SharingRequest {
        public boolean enabled;
    }

    class FamilyRequest {
        public String email;
        public String name;
        public String relation;
    }

    class SevaRequest {
        public String title;
        public String description;
        public String category;
        public double price;
        public String location;
        public String availableFrom;
        public String availableTo;
    }
}
