pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'ichahbani'
        IMAGE_NAME      = "${DOCKER_REGISTRY}/hr-frontend"
        SONAR_HOST_URL  = 'http://host.docker.internal:9000'
    }

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        booleanParam(name: 'SKIP_SONAR',       defaultValue: false, description: 'Ignorer SonarQube')
        booleanParam(name: 'PUSH_TO_REGISTRY', defaultValue: false, description: 'Publier sur Docker Hub')
    }

    stages {

        stage('1 — Checkout') {
            steps {
                script {
                    def commit = env.GIT_COMMIT ?: 'nogit'
                    env.SHORT_COMMIT = commit.length() > 7 ? commit.substring(0, 7) : commit
                    env.IMAGE_TAG    = "${env.BUILD_NUMBER}-${env.SHORT_COMMIT}"
                    env.BRANCH       = (env.GIT_BRANCH ?: 'main').replaceAll('origin/', '')
                }
                echo "Build #${env.BUILD_NUMBER} | Branch: ${env.BRANCH} | Tag: ${env.IMAGE_TAG}"
            }
        }

        stage('2 — npm install') {
            steps {
                sh 'npm ci --prefer-offline'
            }
        }

        stage('3 — Tests & Coverage') {
            steps {
                sh 'npm run test:coverage -- --passWithNoTests'
            }
            post {
                always {
                    publishHTML([
                        allowMissing:          true,
                        alwaysLinkToLastBuild: true,
                        keepAll:               true,
                        reportDir:             'coverage',
                        reportFiles:           'index.html',
                        reportName:            'Frontend Coverage'
                    ])
                }
            }
        }

        stage('4 — SonarQube') {
            when { not { expression { return params.SKIP_SONAR } } }
            steps {
                withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        npx sonar-scanner \
                            -Dsonar.host.url="$SONAR_HOST_URL" \
                            -Dsonar.token="$SONAR_TOKEN"
                    '''
                }
            }
        }

        stage('5 — Quality Gate') {
            when { not { expression { return params.SKIP_SONAR } } }
            steps {
                script {
                    withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                        sleep 10
                        def qg = sh(
                            script: '''
                                curl -s -u "$SONAR_TOKEN:" \
                                    "$SONAR_HOST_URL/api/qualitygates/project_status?projectKey=hr-frontend" \
                                    | grep -o '"status":"[^"]*"' | head -1
                            ''',
                            returnStdout: true
                        ).trim()
                        echo "Quality Gate : ${qg}"
                        if (qg.contains('ERROR')) {
                            error("Quality Gate FAILED")
                        }
                    }
                }
            }
        }

        stage('6 — Docker Build') {
            steps {
                sh """
                    docker build \
                        --build-arg BUILD_DATE=\$(date -u +%Y-%m-%dT%H:%M:%SZ) \
                        --build-arg VCS_REF=${env.SHORT_COMMIT} \
                        -t ${IMAGE_NAME}:${env.IMAGE_TAG} \
                        -t ${IMAGE_NAME}:latest \
                        .
                """
            }
        }

        stage('7 — Docker Push') {
            when {
                allOf {
                    expression { return env.BRANCH == 'main' }
                    expression { return params.PUSH_TO_REGISTRY }
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ''' + IMAGE_NAME + ''':''' + env.IMAGE_TAG + '''
                        docker push ''' + IMAGE_NAME + ''':latest
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                try { cleanWs() } catch (ignored) { echo "cleanWs ignoré" }
            }
        }
        success  { echo "Frontend pipeline réussie — tag: ${env.IMAGE_TAG ?: 'N/A'}" }
        failure  { echo "Frontend pipeline échouée" }
        unstable { echo "Frontend pipeline instable" }
    }
}
