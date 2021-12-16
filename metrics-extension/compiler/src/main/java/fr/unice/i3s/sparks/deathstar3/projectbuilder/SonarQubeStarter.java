/*
 * This file is part of symfinder.
 *
 *  symfinder is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  symfinder is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with symfinder. If not, see <http://www.gnu.org/licenses/>.
 *
 *  Copyright 2018-2021 Johann Mortara <johann.mortara@univ-cotedazur.fr>
 *  Copyright 2018-2021 Xhevahire Tërnava <t.xheva@gmail.com>
 *  Copyright 2018-2021 Philippe Collet <philippe.collet@univ-cotedazur.fr>
 */

package fr.unice.i3s.sparks.deathstar3.projectbuilder;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.BuildImageResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.model.ExposedPort;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.PortBinding;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientBuilder;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import fr.unice.i3s.sparks.deathstar3.models.SonarQubeStatus;
import fr.unice.i3s.sparks.deathstar3.utils.Utils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Set;

@Slf4j
public class SonarQubeStarter {

    private static final Utils utils = new Utils();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final DockerClient dockerClient;
    private final RestTemplate restTemplate = new RestTemplate();

    public SonarQubeStarter() {
        DockerClientConfig standard = DefaultDockerClientConfig.createDefaultConfigBuilder().build();
        ApacheDockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                .dockerHost(standard.getDockerHost())
                .sslConfig(standard.getSSLConfig())
                .maxConnections(100)
                .connectionTimeout(Duration.ofSeconds(30))
                .responseTimeout(Duration.ofSeconds(45))
                .build();
        dockerClient = DockerClientBuilder.getInstance().withDockerHttpClient(httpClient).build();
    }

    private boolean checkIfSonarqubeHasExited(String containerId) {
        InspectContainerResponse container = dockerClient.inspectContainerCmd(containerId).exec();
        log.info(container.getState().toString());
        log.info(containerId + " : " + container.getState().getStatus());
        return container.getState().getStatus().strip().equals("exited");
    }

    public synchronized boolean startSonarqube() {

        utils.removeOldExitedContainer(Constants.SONARQUBE_CONTAINER_NAME);
        if (existingSonarqube()) {
            return true;
        }

        prepareVaricitySonarqube();

        utils.createNetwork();

        CreateContainerResponse container = dockerClient.createContainerCmd("varicity-sonarqube")
                .withName(Constants.SONARQUBE_CONTAINER_NAME).withExposedPorts(ExposedPort.parse("9000"))
                .withHostConfig(HostConfig.newHostConfig().withPortBindings(PortBinding.parse("9000:9000"))
                        .withNetworkMode(Constants.NETWORK_NAME))
                .exec();

        dockerClient.startContainerCmd(container.getId()).exec();

        while (true) {
            try {

                if (checkIfSonarqubeHasExited(container.getId())) {
                    return false;
                }

                var sonarqubeStatusResponse = this.restTemplate.getForEntity(Constants.SONARQUBE_LOCAL_URL + "/api/system/status",
                        String.class);
                var sonarqubeStatus = this.objectMapper.readValue(sonarqubeStatusResponse.getBody(),
                        SonarQubeStatus.class);
                if (sonarqubeStatus.status().equals("UP")) {
                    break;
                }

            } catch (Exception e) {
                log.info("Sonarqube is not ready yet " + e.getClass().getName());
            }
            try {

                Thread.sleep(5000);
            } catch (InterruptedException e) {
                e.printStackTrace();
                break;
            }
        }
        return true;
    }

    private void sonarqubeStartingWaitForSonarqubeUp() {
        while (true) {
            try {
                var sonarqubeStatusResponse = this.restTemplate.getForEntity(Constants.SONARQUBE_LOCAL_URL + "/api/system/status",
                        String.class);
                var sonarqubeStatus = this.objectMapper.readValue(sonarqubeStatusResponse.getBody(),
                        SonarQubeStatus.class);
                if (sonarqubeStatus.status().equals("UP")) {
                    return;
                }

            } catch (ResourceAccessException e) {
                log.info("Sonarqube has exited or was not UP " + e);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
    }

    private boolean existingSonarqube() {
        try {

            var sonarqubeStatusResponse = this.restTemplate.getForEntity(Constants.SONARQUBE_LOCAL_URL + "/api/system/status",
                    String.class);
            var sonarqubeStatus = this.objectMapper.readValue(sonarqubeStatusResponse.getBody(),
                    SonarQubeStatus.class);
            if (sonarqubeStatus.status().equals("UP")) {
                return true;
            } else if (sonarqubeStatus.status().equals("STARTING")) {
                sonarqubeStartingWaitForSonarqubeUp();
                return true;
            }

        } catch (ResourceAccessException exception) {
            log.info("No instance of sonarqube was running");
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }

        return false;
    }

    private void prepareVaricitySonarqube() {

        if (utils.checkIfImageExists("varicity-sonarqube", "latest")) {
            return;
        }

        try {
            Path dir = Files.createTempDirectory("sonarqube-docker-varicity");
            Path dockerFilePath = Files.createTempFile(dir, "sonarqube-varicity", ".dockerfile");

            Files.copy(SonarQubeStarter.class.getClassLoader().getResourceAsStream("varicity-sonarqube.dockerfile"),
                    dockerFilePath, StandardCopyOption.REPLACE_EXISTING);
            dockerClient.buildImageCmd()
                    .withDockerfile(dockerFilePath.toFile())
                    .withPull(true).withNoCache(true).withTags(Set.of("varicity-sonarqube:latest"))
                    .exec(new BuildImageResultCallback()).awaitImageId();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

}