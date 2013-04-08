module.exports = function(grunt) {

    grunt.initConfig({
        meta: {
            name: 'Ember Animated Outlet Demo'
        },
        compass: {
            dist: {
                options: {
                    sassDir: 'sass',
                    cssDir: 'public/css',
                    environment: 'production'
                }
            }
        },
        watch: {
            files: [
                'sass/**/*'
            ],
            tasks: ['default']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['compass']);

};