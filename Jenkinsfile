pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = 'suzhi11/taskflow-frontend'
        BACKEND_IMAGE  = 'suzhi11/taskflow-backend'
        TAG            = "${env.BUILD_NUMBER}"
        KUBECTL        = '/snap/bin/kubectl'
        NS             = 'workshop'
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Build Images') {
            steps {
                sh 'docker build -t $FRONTEND_IMAGE:$TAG -t $FRONTEND_IMAGE:latest app/frontend'
                sh 'docker build -t $BACKEND_IMAGE:$TAG -t $BACKEND_IMAGE:latest app/backend'
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                                  usernameVariable: 'DH_USER',
                                                  passwordVariable: 'DH_PASS')]) {
                    sh 'echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin'
                    sh 'docker push $FRONTEND_IMAGE:$TAG && docker push $FRONTEND_IMAGE:latest'
                    sh 'docker push $BACKEND_IMAGE:$TAG && docker push $BACKEND_IMAGE:latest'
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    set -e
                    cd k8s_manifests
                    $KUBECTL apply -f mongo/secrets.yaml -f mongo/pvc.yaml -f mongo/deploy.yaml -f mongo/service.yaml
                    $KUBECTL apply -f backend-deployment.yaml -f backend-service.yaml -f frontend-deployment.yaml -f frontend-service.yaml
                    NODE_IP=$($KUBECTL get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
                    $KUBECTL set env deployment/frontend -n $NS REACT_APP_BACKEND_URL=http://$NODE_IP:30001/api/tasks
                    $KUBECTL set image deployment/api api=$BACKEND_IMAGE:$TAG -n $NS
                    $KUBECTL set image deployment/frontend frontend=$FRONTEND_IMAGE:$TAG -n $NS
                    $KUBECTL rollout status deployment/api -n $NS --timeout=180s
                    $KUBECTL rollout status deployment/frontend -n $NS --timeout=180s
                '''
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    NODE_IP=$($KUBECTL get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
                    for i in $(seq 1 12); do
                        curl -sf http://$NODE_IP:30001/ok && exit 0
                        sleep 5
                    done
                    exit 1
                '''
            }
        }
    }

    post {
        success { echo "Build ${env.BUILD_NUMBER} deployed to Kubernetes" }
        failure { echo "Build ${env.BUILD_NUMBER} failed - check the console output" }
        always  { sh 'docker logout || true' }
    }
}
