cmake_minimum_required(VERSION 3.16)
project(kytin_sentinel VERSION 1.0.0 LANGUAGES CXX)

# ============================================================================
# Kytin Protocol - The Sentinel (C++ Daemon)
# Hardware Root of Trust for Autonomous AI Agents
# State-Locked Protocol™ (Patent Pending)
# ============================================================================

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Build type defaults to Release
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif()

# Compiler flags
set(CMAKE_CXX_FLAGS_DEBUG "-g -O0 -DDEBUG")
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")

# ============================================================================
# MOCK TPM OPTION (Default: ON for easy testing)
# ============================================================================

option(MOCK_TPM "Use mock TPM instead of real hardware (no libtss2 required)" ON)

if(MOCK_TPM)
    message(STATUS "*** MOCK TPM MODE ENABLED ***")
    message(STATUS "No TPM hardware or libtss2 libraries required")
    add_compile_definitions(MOCK_TPM)
endif()

# ============================================================================
# DEPENDENCIES (Header-only libraries via FetchContent)
# ============================================================================

include(FetchContent)

# cpp-httplib (single-header HTTP library)
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG v0.14.3
)

# nlohmann/json (single-header JSON library)
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
)

FetchContent_MakeAvailable(httplib json)

# ============================================================================
# SOURCES
# ============================================================================

set(SENTINEL_SOURCES
    src/main.cpp
    src/kytin_tpm.cpp
)

# ============================================================================
# EXECUTABLE
# ============================================================================

add_executable(kytin_sentinel ${SENTINEL_SOURCES})

target_include_directories(kytin_sentinel PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${httplib_SOURCE_DIR}
    ${json_SOURCE_DIR}/include
)

target_link_libraries(kytin_sentinel PRIVATE
    nlohmann_json::nlohmann_json
)

# ============================================================================
# TPM 2.0 REAL HARDWARE SUPPORT (Optional - only if MOCK_TPM is OFF)
# ============================================================================

if(NOT MOCK_TPM)
    find_package(PkgConfig QUIET)
    if(PkgConfig_FOUND)
        pkg_check_modules(TPM2 QUIET tss2-esys tss2-rc tss2-tctildr)
        if(TPM2_FOUND)
            message(STATUS "TPM 2.0 TSS libraries found - enabling hardware support")
            target_compile_definitions(kytin_sentinel PRIVATE KYTIN_TPM_ENABLED)
            target_link_libraries(kytin_sentinel PRIVATE ${TPM2_LIBRARIES})
            target_include_directories(kytin_sentinel PRIVATE ${TPM2_INCLUDE_DIRS})
        else()
            message(WARNING "TPM 2.0 TSS not found - falling back to mock mode at runtime")
        endif()
    endif()
endif()

# ============================================================================
# PLATFORM-SPECIFIC CONFIGURATION
# ============================================================================

if(APPLE)
    target_compile_definitions(kytin_sentinel PRIVATE KYTIN_PLATFORM_MACOS)
elseif(UNIX)
    target_compile_definitions(kytin_sentinel PRIVATE KYTIN_PLATFORM_LINUX)
    target_link_libraries(kytin_sentinel PRIVATE pthread)
elseif(WIN32)
    target_compile_definitions(kytin_sentinel PRIVATE KYTIN_PLATFORM_WINDOWS)
    target_link_libraries(kytin_sentinel PRIVATE ws2_32)
endif()

# ============================================================================
# INSTALLATION
# ============================================================================

install(TARGETS kytin_sentinel
    RUNTIME DESTINATION bin
)

install(FILES
    ${CMAKE_CURRENT_SOURCE_DIR}/include/kytin.hpp
    ${CMAKE_CURRENT_SOURCE_DIR}/include/kytin_tpm.hpp
    DESTINATION include/kytin
)

# ============================================================================
# BUILD INFO
# ============================================================================

message(STATUS "")
message(STATUS "╔═══════════════════════════════════════════════════════════╗")
message(STATUS "║   KYTIN SENTINEL BUILD CONFIGURATION                      ║")
message(STATUS "╠═══════════════════════════════════════════════════════════╣")
message(STATUS "║   Version:      ${PROJECT_VERSION}")
message(STATUS "║   Build Type:   ${CMAKE_BUILD_TYPE}")
message(STATUS "║   C++ Standard: C++${CMAKE_CXX_STANDARD}")
message(STATUS "║   Mock TPM:     ${MOCK_TPM}")
if(NOT MOCK_TPM)
message(STATUS "║   TPM Support:  ${TPM2_FOUND}")
endif()
message(STATUS "╚═══════════════════════════════════════════════════════════╝")
message(STATUS "")
