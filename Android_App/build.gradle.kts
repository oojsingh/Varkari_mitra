plugins {
    kotlin("android") version "1.9.10" apply false
    id("com.android.application") version "8.2.0" apply false
    id("com.google.gms.google-services") version "4.4.0" apply false
}

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.0")
    }
}
