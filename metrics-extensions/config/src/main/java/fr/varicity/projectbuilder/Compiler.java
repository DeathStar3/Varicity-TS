package fr.varicity.projectbuilder;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.CreateNetworkResponse;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DockerClientBuilder;

import fr.varicity.models.ProjectConfig;
import fr.varicity.models.SonarQubeToken;
import org.apache.commons.codec.binary.Base64;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class Compiler {

    private final DockerClient dockerClient = DockerClientBuilder.getInstance().build();

    private final RestTemplate restTemplate =  new RestTemplate();
    private final ObjectMapper objectMapper=new ObjectMapper();

    private static final String NETWORK_NAME ="varicity-config";

    public Compiler(){

    }

    public void compileProject(ProjectConfig projectConfig) {
        Volume volume = new Volume("/project");
        CreateContainerResponse container = dockerClient.createContainerCmd(projectConfig.buildEnv())
                        .withHostConfig(HostConfig.newHostConfig().withBinds(new Bind(projectConfig.path(), volume, AccessMode.rw)  ))
        .withEntrypoint("mvn", "clean", "package", "-f", "/project/" + projectConfig.sourceRoot()+"pom.xml" ). exec();//TODO assuming the project is a mvn project

       dockerClient.startContainerCmd(container.getId()) .exec();       
                
    }


    public void startSonarqube(){
        CreateContainerResponse container = dockerClient.createContainerCmd("varicity-sonarqube").withName("sonarqubehost")
                .withExposedPorts(ExposedPort.parse("9000")).withHostConfig(
                HostConfig.newHostConfig().withPortBindings(PortBinding.parse("9000:9000")).withNetworkMode(NETWORK_NAME)
        ).exec();

        dockerClient.startContainerCmd(container.getId()) .exec();
    }

    private HttpHeaders createHeaders(String username, String password){
        return new HttpHeaders() {{
            String auth = username + ":" + password;
            byte[] encodedAuth = Base64.encodeBase64(
                    auth.getBytes(StandardCharsets.US_ASCII) );
            String authHeader = "Basic " + new String( encodedAuth );
            set( "Authorization", authHeader );
        }};
    }

    /**
     * https://www.baeldung.com/how-to-use-resttemplate-with-basic-authentication-in-spring
     * @param token_name
     * @return
     * @throws JsonProcessingException
     */
    public SonarQubeToken getToken(String token_name, String sonarqubeUrl) throws JsonProcessingException {
        //curl -u admin:admin -X POST http://localhost:9000/api/user_tokens/generate?name=mytoken



                var response=restTemplate.exchange
                (sonarqubeUrl+"/api/user_tokens/generate?name="+token_name, HttpMethod.POST, new HttpEntity<>(createHeaders("admin", "admin")), String.class);


        return this.objectMapper.readValue(response.getBody(), SonarQubeToken.class) ;
    }

    public void runSonarScannerCli(ProjectConfig projectConfig, SonarQubeToken token){


        List<Network> networks = dockerClient.listNetworksCmd().withNameFilter(NETWORK_NAME).exec();
        if (networks.isEmpty()) {
            CreateNetworkResponse networkResponse = dockerClient
                    .createNetworkCmd()
                    .withName(NETWORK_NAME)
                    .withAttachable(true)
                    .withDriver("bridge").exec();
            System.out.printf("Network %s created...\n", networkResponse.getId());
        }


        Volume volume = new Volume("/usr/src");
        String completePath="";
        if(projectConfig.sourceRoot().isBlank()){
            completePath=projectConfig.path();
        }
        else{
            completePath=projectConfig.path()+"/"+projectConfig.sourceRoot();
        }



        CreateContainerResponse container = dockerClient.createContainerCmd("sonarsource/sonar-scanner-cli").withEnv("SONAR_LOGIN="+token.token())
                .withHostConfig(
                        HostConfig.newHostConfig().withBinds(new Bind(completePath, volume, AccessMode.rw))
                                .withNetworkMode(NETWORK_NAME)
                )

                .withEnv("SONAR_HOST_URL="+projectConfig.sonarqubeUrl()).exec();

        dockerClient.startContainerCmd(container.getId()) .exec();
    }
}
