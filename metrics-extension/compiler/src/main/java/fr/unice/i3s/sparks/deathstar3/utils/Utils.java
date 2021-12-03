package fr.unice.i3s.sparks.deathstar3.utils;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateNetworkResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.command.PullImageResultCallback;
import com.github.dockerjava.api.model.Network;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientBuilder;
import com.github.dockerjava.core.DockerClientConfig;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static fr.unice.i3s.sparks.deathstar3.projectbuilder.Constants.NETWORK_NAME;

@Slf4j
public class Utils {

    private final DockerClient dockerClient;

    public Utils() {
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

    public boolean checkIfImageExists(String image, String tag) {
        return dockerClient.listImagesCmd().exec().stream()
                .anyMatch(img -> Arrays.stream(img.getRepoTags()).anyMatch(name -> name.equals(image + ":" + tag)));
    }

    private boolean checkIfContainerHasExited(String containerId) {
        InspectContainerResponse container = dockerClient.inspectContainerCmd(containerId).exec();
        log.info(container.getState().toString());
        log.info(containerId + " : " + container.getState().getStatus());
        return container.getState().getStatus().strip().equals("exited");
    }

    public void removeOldExitedContainer(String containerName) {
        var containers = dockerClient.listContainersCmd()
                .withShowAll(true)
                .withStatusFilter(List.of("exited")).withNameFilter(List.of(containerName)).exec();
        for (var container : containers) {
            dockerClient.removeContainerCmd(container.getId())
                    .exec();
        }
    }

    public void createNetwork() {
        List<Network> networks = dockerClient.listNetworksCmd().withNameFilter(NETWORK_NAME).exec();
        if (networks.isEmpty()) {
            CreateNetworkResponse networkResponse = dockerClient.createNetworkCmd().withName(NETWORK_NAME)
                    .withAttachable(true).withDriver("bridge").exec();
            log.info(String.format("Network %s created...\n", networkResponse.getId()));
        }
    }

    public void downloadImage(String image, String tag) throws InterruptedException {

        dockerClient.pullImageCmd(image).withTag(tag).exec(new PullImageResultCallback()).awaitCompletion(7,
                TimeUnit.MINUTES);
    }


    public String getUserIdentity() {
        String user = "1000";
        String group = "1000";
        if (OSUtils.isUnix()) {
            Runtime rt = Runtime.getRuntime();
            try {
                Process process = rt.exec("id -u");
                Process getGroup = rt.exec("id -g");
                int exitCode = process.waitFor();
                int exitCodeGroup = getGroup.waitFor();
                if (exitCode == 0) {
                    user = new String(process.getInputStream().readAllBytes()).strip();
                }
                if (exitCodeGroup == 0) {
                    group = new String(getGroup.getInputStream().readAllBytes()).strip();
                }
            } catch (IOException | InterruptedException e) {
                e.printStackTrace();
            }
        }

        return user + ":" + group;
    }




}
