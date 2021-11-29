package fr.unice.i3s.sparks.deathstar3.entrypoint;

import fr.unice.i3s.sparks.deathstar3.MetricGatherer;
import fr.unice.i3s.sparks.deathstar3.engine.configuration.Configuration;
import fr.unice.i3s.sparks.deathstar3.engine.configuration.ParametersObject;
import fr.unice.i3s.sparks.deathstar3.engine.entrypoint.Symfinder;
import fr.unice.i3s.sparks.deathstar3.model.ExperimentConfig;
import fr.unice.i3s.sparks.deathstar3.model.ExperimentResult;
import fr.unice.i3s.sparks.deathstar3.model.MetricSource;
import fr.unice.i3s.sparks.deathstar3.projectbuilder.Compiler;
import fr.unice.i3s.sparks.deathstar3.projectbuilder.SonarQubeStarter;
import fr.unice.i3s.sparks.deathstar3.engine.result.SymfinderResult;
import fr.unice.i3s.sparks.deathstar3.serializer.model.Node;
import fr.unice.i3s.sparks.deathstar3.sourcesfetcher.SourceFetcher;
import org.eclipse.jgit.api.errors.GitAPIException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;


public class MetricExtensionEntrypoint {


    private final ExecutorService executor = Executors.newFixedThreadPool(1);
    private final SourceFetcher sourceFetcher = new SourceFetcher();
    private final SonarQubeStarter sonarQubeStarter = new SonarQubeStarter();
    private final Compiler compiler = new Compiler();
    private final MetricGatherer metricGatherer = new MetricGatherer();


    public ExperimentResult runExperiment(ExperimentConfig config, ParametersObject symfinderConfig){
        try {
           return  this.runExperimentInternal(config,symfinderConfig);
        }catch (Exception exception){
            throw new RuntimeException(exception);
        }

    }

    public ExperimentResult runExperimentInternal(ExperimentConfig config, ParametersObject symfinderConfig) throws GitAPIException, IOException, InterruptedException, ExecutionException{

        Map<String, List<Node>> metricsResult = new HashMap<>();

        if (config.getPath() == null || config.getPath().isBlank()) {//implique que skipClone est false
            config.setPath(Files.createTempDirectory("varicity-xp-projects").toString());
        }

        String repositoryPath = config.getPath();
        if (!config.isSkipClone()) {
            config.setRepositoryUrl(this.sourceFetcher.normalizeRepositoryUrl(config.getRepositoryUrl()));
            List<String> repositories = sourceFetcher.cloneRepository(config);
            repositoryPath = repositories.get(0);//We assume one tagId or commitId per project
        }


        Thread qualityMetrics = null;
        if (config.isSonarqubeNeeded()) {
            qualityMetrics = new Thread(() -> {
                sonarQubeStarter.startSonarqube();
                compiler.executeProject(config);
                //la mise à jour de sonarqube par rapport au nouveau projet n'est pas immédiate
                // le sleep introduit un délai pour attendre que la mise à jour se fasse avant que le metric gatherer ne soit appelé
                try {
                    Thread.sleep(4000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });

            qualityMetrics.start();

        }

        Path workingDirectory;

        //if the output path is not defined a temporary one is created
        if (config.getOutputPath() == null || config.getOutputPath().isBlank()) {
            workingDirectory = Files.createTempDirectory("varicity-work-dir");
            config.setOutputPath(workingDirectory.toAbsolutePath().toString());
        } else {
            workingDirectory = Path.of(config.getOutputPath());
        }


        config.setPath(repositoryPath);
        String finalRepositoryPath = repositoryPath;
        Path finalWorkingDirectory = workingDirectory;
        Future<SymfinderResult> futureSymfinderResult = executor.submit(() -> {
            return new Symfinder(finalRepositoryPath, finalWorkingDirectory + "/symfinder/result.json", new Configuration(symfinderConfig)).run();
        });


        if (qualityMetrics != null) {
            qualityMetrics.join();
        }


        if (config.getSources() != null) {

            for (MetricSource source : config.getSources()) {

                List<Node> nodes1 = metricGatherer.gatherMetrics(config.getProjectName(), workingDirectory.toString(), source);
                if (!nodes1.isEmpty()) {
                    metricsResult.put(source.getName(), nodes1);
                }
            }
        }

        return new ExperimentResult(config.getProjectName(), futureSymfinderResult.get(), metricsResult);
    }
}
