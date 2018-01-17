var Constants = (function() {
    return {
        // Separate Dev and Prod in case they are different apps
        LEANPLUM_CONFIG: {
            DEV: {
                ID: 'app_diQFBcAhlYfnqtnrHPA3jBXlpOYgAaDX7W7fKi2MiZk',
                KEY: 'dev_NFEmNonbF7ScaOceUV3BXrNTb2vR8xKc7sEJ1TWd4fo',
            },
            PROD: {
                ID: 'app_diQFBcAhlYfnqtnrHPA3jBXlpOYgAaDX7W7fKi2MiZk',
                KEY: 'prod_r6Qk6UkaKHfuP7WU5xxFarMMCGxSEKQjJTn2goKi97o',
            },
            API_VERSION: '1.0.6'
        },

        LEANPLUM_KEYS: {
            ACTIVE_TIME: '__leanplum_active_time'
        },

        LEANPLUM_CONST: {
            SESSION_ACTIVITY_TIME: 30, // Minutes
            APP_VERSION: 1.0
        },

        // Sample variables. This can be any JSON object.
        LEANPLUM_VARIABLES: {
         isStandardMode: true,
         theme: "Dark"
        },

        LEANPLUM_USER_ATTRIBUTES: {
         THEME_ENABLED: 'theme-enabled'
        }
 }

}());