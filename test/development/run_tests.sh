#!/bin/bash
# Development environment test runner
# This script runs all tests in the development environment

# Colors for output
green="\033[0;32m"
red="\033[0;31m"
yellow="\033[1;33m"
reset="\033[0m"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Test results
API_TEST_RESULT=0
FRONTEND_TEST_RESULT=0

# Function to print a section header
print_header() {
    echo -e "\n${yellow}============================================${reset}"
    echo -e "${yellow}${1}${reset}"
    echo -e "${yellow}============================================${reset}"
}

# Function to print a test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${green}✅ $2${reset}"
    else
        echo -e "${red}❌ $2${reset}"
    fi
}

# Function to run API tests
run_api_tests() {
    print_header "Running API Tests"
    
    if [ -f "$SCRIPT_DIR/test_api.py" ]; then
        echo -e "Running API tests: $SCRIPT_DIR/test_api.py"
        python3 "$SCRIPT_DIR/test_api.py"
        API_TEST_RESULT=$?
        print_result $API_TEST_RESULT "API Tests"
    else
        echo -e "${red}API test file not found: $SCRIPT_DIR/test_api.py${reset}"
        API_TEST_RESULT=1
    fi
}

# Function to run frontend login test
run_frontend_login_test() {
    print_header "Running Frontend Login Test"
    
    if [ -f "$SCRIPT_DIR/test_login.js" ]; then
        echo -e "Running frontend login test: $SCRIPT_DIR/test_login.js"
        node "$SCRIPT_DIR/test_login.js"
        FRONTEND_TEST_RESULT=$?
        print_result $FRONTEND_TEST_RESULT "Frontend Login Test"
    else
        echo -e "${red}Frontend login test file not found: $SCRIPT_DIR/test_login.js${reset}"
        FRONTEND_TEST_RESULT=1
    fi
}

# Function to run all tests
run_all_tests() {
    print_header "Starting Development Environment Tests"
    echo -e "Test directory: $SCRIPT_DIR"
    echo -e "Timestamp: $(date)"
    
    # Run API tests
    run_api_tests
    
    # Run frontend tests
    run_frontend_login_test
    
    # Print overall results
    print_header "Test Results Summary"
    print_result $API_TEST_RESULT "API Tests"
    print_result $FRONTEND_TEST_RESULT "Frontend Login Test"
    
    # Determine overall result
    if [ $API_TEST_RESULT -eq 0 ] && [ $FRONTEND_TEST_RESULT -eq 0 ]; then
        echo -e "\n${green}🎉 All tests passed!${reset}"
        return 0
    else
        echo -e "\n${red}❌ Some tests failed!${reset}"
        return 1
    fi
}

# Function to show help
show_help() {
    echo -e "${yellow}Development Environment Test Runner${reset}"
    echo -e "\nUsage: $0 [OPTIONS]"
    echo -e "\nOptions:"
    echo -e "  --api-only      Run only API tests"
    echo -e "  --frontend-only Run only frontend tests"
    echo -e "  --help          Show this help message"
    echo -e "\nWithout options, all tests will be run."
}

# Main script logic
case $1 in
    --api-only)
        run_api_tests
        exit $API_TEST_RESULT
        ;;
    --frontend-only)
        run_frontend_login_test
        exit $FRONTEND_TEST_RESULT
        ;;
    --help)
        show_help
        exit 0
        ;;
    "")
        run_all_tests
        exit $?
        ;;
    *)
        echo -e "${red}Invalid option: $1${reset}"
        show_help
        exit 1
        ;;
esac
