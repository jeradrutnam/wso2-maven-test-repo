properties([pipelineTriggers([githubPush()])])

node ('COMPONENT_ECS') {
    stage ('Checkout'){
        git url: 'https://github.com/kasunbg/wso2-maven-test-repo.git'
    }
    stage ('Build'){
        echo build
    }
    stage ('Test'){
        // steps
    }
}    
