import neo4j_types.EntityType;
import neo4j_types.EntityVisibility;
import neo4j_types.RelationType;
import org.junit.jupiter.api.Test;
import org.neo4j.driver.types.Node;

import static org.junit.Assert.assertEquals;

public class ClassAttributeComposition extends Neo4jTest{

    @Test
    public void OneAttribute() {
        runTest(graph -> {
            Node rectangleClass = graph.createNode("Rectangle", EntityType.CLASS, EntityVisibility.PUBLIC);
            Node drawClass = graph.createNode("draw", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.linkTwoNodes(rectangleClass, drawClass, RelationType.INSTANCIATE);
            graph.setNbComposition();

            assertEquals(1,graph.getNbAttributeComposeClass());
        });
    }

    @Test
    public void TwoAttributesPerClass() {
        runTest(graph -> {
            Node rectangleClass = graph.createNode("Rectangle", EntityType.CLASS, EntityVisibility.PUBLIC);
            Node drawClass = graph.createNode("draw", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.linkTwoNodes(rectangleClass, drawClass, RelationType.INSTANCIATE);

            Node shapeClass = graph.createNode("Shape", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.linkTwoNodes(rectangleClass, shapeClass, RelationType.INSTANCIATE);
            graph.setNbComposition();

            assertEquals(2,graph.getNbAttributeComposeClass());
        });
    }

    @Test
    public void MultipleRelations() {
        runTest(graph -> {
            Node rectangleClass = graph.createNode("Rectangle", EntityType.CLASS, EntityVisibility.PUBLIC);
            Node drawClass = graph.createNode("draw", EntityType.CLASS, EntityVisibility.PUBLIC);
            Node fillClass = graph.createNode("draw", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.linkTwoNodes(rectangleClass, drawClass, RelationType.INSTANCIATE);
            graph.linkTwoNodes(rectangleClass,fillClass,RelationType.INSTANCIATE);

            Node shapeClass = graph.createNode("Shape", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.linkTwoNodes(rectangleClass, shapeClass, RelationType.EXTENDS);
            graph.setNbComposition();

            assertEquals(2,graph.getNbAttributeComposeClass());
        });
    }

    @Test
    public void InterfaceAttributeTest() {
        runTest(graph -> {
            Node rectangleClass = graph.createNode("Rectangle", EntityType.CLASS, EntityVisibility.PUBLIC);
            Node drawClass = graph.createNode("draw", EntityType.CLASS, EntityVisibility.PUBLIC);
            graph.linkTwoNodes(rectangleClass, drawClass, RelationType.INSTANCIATE);

            Node shapeClass = graph.createNode("Shape", EntityType.INTERFACE, EntityVisibility.PUBLIC);
            graph.linkTwoNodes(rectangleClass, shapeClass, RelationType.INSTANCIATE);
            graph.setNbComposition();

            assertEquals(2,graph.getNbAttributeComposeClass());
        });
    }
}
