import fr.unice.i3s.sparks.deathstar3.symfinder.engine.neo4j_types.EntityType;
import fr.unice.i3s.sparks.deathstar3.symfinder.engine.neo4j_types.EntityVisibility;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ClassPublicTest extends Neo4jTest {

    @Test
    public void OnePublicClass() {
        runTest(graph -> {
            graph.createNode("Shapes", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.detectVPsAndVariants();
            Assertions.assertEquals(1, graph.getNbPublicClass());
        });
    }

    @Test
    public void OnePrivateClass() {
        runTest(graph -> {
            graph.createNode("Rectangle", EntityType.CLASS, EntityVisibility.PRIVATE);
            graph.detectVPsAndVariants();
            Assertions.assertEquals(0, graph.getNbPublicClass());
        });
    }

    @Test
    public void OnePublicAndPrivateClass() {
        runTest(graph -> {
            graph.createNode("Forms", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.createNode("Cricle", EntityType.CLASS, EntityVisibility.PRIVATE);
            graph.detectVPsAndVariants();
            Assertions.assertEquals(1, graph.getNbPublicClass());
        });
    }

    @Test
    public void TwoPublicAndOnePrivateClass() {
        runTest(graph -> {
            graph.createNode("Forms", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.createNode("Cricle", EntityType.CLASS, EntityVisibility.PRIVATE);
            graph.createNode("Test2", EntityType.INTERFACE, EntityVisibility.PUBLIC);
            graph.detectVPsAndVariants();
            Assertions.assertEquals(2, graph.getNbPublicClass());
        });
    }
}