pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DOCKERHUB_CREDENTIALS_ID = 'survey-dockerhub'
        FRONTEND_IMAGE = 'pcdpbit/survey-frontend'
        NGINX_IMAGE = 'pcdpbit/survey-nginx'
        IMAGE_TAG_PREFIX = 'v1.0'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and Push Frontend and Nginx Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                    sh '''
                        set -e
                        IMAGE_TAG="${IMAGE_TAG_PREFIX}.${BUILD_NUMBER}"

                        echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
                        docker build --pull -t ${FRONTEND_IMAGE}:${IMAGE_TAG} .
                        docker build --pull -f deploy/nginx-proxy.Dockerfile -t ${NGINX_IMAGE}:${IMAGE_TAG} .
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${NGINX_IMAGE}:${IMAGE_TAG}
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy Frontend Stack') {
            steps {
                sh '''
                    set -e
                    IMAGE_TAG="${IMAGE_TAG_PREFIX}.${BUILD_NUMBER}"

                    docker network inspect survey_net >/dev/null 2>&1 || docker network create survey_net
                    FRONTEND_IMAGE=${FRONTEND_IMAGE} NGINX_IMAGE=${NGINX_IMAGE} IMAGE_TAG=${IMAGE_TAG} docker compose -f docker-compose.frontend.yml pull
                    FRONTEND_IMAGE=${FRONTEND_IMAGE} NGINX_IMAGE=${NGINX_IMAGE} IMAGE_TAG=${IMAGE_TAG} docker compose -f docker-compose.frontend.yml up -d
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo 'Frontend deployment completed successfully.'
        }
        failure {
            echo 'Frontend deployment failed.'
        }
    }
}
