package fr.unice.i3s.sparks.deathstar3.sourcesfetcher;

import fr.unice.i3s.sparks.deathstar3.logging.DefaultSymfinderLogger;
import fr.unice.i3s.sparks.deathstar3.logging.ISymfinderLogger;
import fr.unice.i3s.sparks.deathstar3.model.ExperimentConfig;
import org.apache.commons.io.FileUtils;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

public class SourceFetcher {

    private ISymfinderLogger logger;
    public SourceFetcher(ISymfinderLogger logger){
        if(logger==null){
            this.logger=new DefaultSymfinderLogger();
        }
        else{
            this.logger = logger;
        }

    }

    public String normalizeRepositoryUrl(String repositoryUrl) {
        repositoryUrl = repositoryUrl.strip();
        if (repositoryUrl.endsWith(".git")) {
            return repositoryUrl;
        } else {
            return repositoryUrl + ".git";
        }
    }

    public List<String> cloneRepository(ExperimentConfig config) throws GitAPIException, IOException {
        List<String> destinations = new ArrayList<>();
        if (config.getPath() != null && !config.getPath().isBlank()) {
            Path originalDestinationPath = Path.of(config.getPath(),
                    getRepositoryNameFromUrl(config.getRepositoryUrl()));
            Git gitRepo;
            if (Files.notExists(originalDestinationPath)) {
                gitRepo = Git.cloneRepository().setURI(config.getRepositoryUrl()).setCloneAllBranches(true)
                        .setDirectory(originalDestinationPath.toFile()).call();
            } else {
                gitRepo = Git.open(originalDestinationPath.toFile());
            }

            List<String> allVersions = new ArrayList<>();

            if (config.getTagIds() != null && !config.getTagIds().isEmpty()) {
                allVersions.addAll(config.getTagIds());
            }

            if (config.getCommitIds() != null && !config.getCommitIds().isEmpty()) {
                allVersions.addAll(config.getCommitIds());
            }

            for (String version : allVersions) {
                gitRepo.checkout().setName(version).call();
                Path specificTagPath = Path.of(originalDestinationPath.getParent().toString(),
                        getRepositoryNameFromUrl(config.getRepositoryUrl()) + "-" + version);
                FileUtils.copyDirectory(originalDestinationPath.toFile(), specificTagPath.toFile());
                destinations.add(specificTagPath.toString());
                logger.info(destinations.toString());
            }
        }
        return destinations;
    }

    public String getRepositoryNameFromUrl(String repositoryUrl) {
        if (repositoryUrl.endsWith(".git")) {
            repositoryUrl = repositoryUrl.substring(0, repositoryUrl.length() - 4);
        }
        String[] parts = repositoryUrl.split("/");
        return parts[parts.length - 1];
    }
}
