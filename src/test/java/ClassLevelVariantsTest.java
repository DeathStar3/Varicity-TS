import neo4j_types.EntityType;
import neo4j_types.RelationType;
import org.junit.Test;
import org.neo4j.driver.v1.types.Node;

import static org.junit.Assert.assertEquals;

public class ClassLevelVariantsTest extends Neo4JTest {

    @Test
    public void NoSubclass() {
        runTest(graph -> {
            graph.createNode("Shape", EntityType.CLASS, EntityType.ABSTRACT);
            assertEquals(0, graph.getNbClassLevelVariants());
        });
    }

    @Test
    public void OneConcreteClass() {
        runTest(graph -> {
            graph.createNode("Shape", EntityType.CLASS);
            assertEquals(0, graph.getNbClassLevelVariants());
        });
    }

    @Test
    public void OneSubclass() {
        runTest(graph -> {
            Node shapeClass = graph.createNode("Shape", EntityType.CLASS, EntityType.ABSTRACT);
            Node circleClass = graph.createNode("Circle", EntityType.CLASS);
            graph.linkTwoNodes(shapeClass, circleClass, RelationType.EXTENDS);
            assertEquals(1, graph.getNbClassLevelVariants());
        });
    }

    @Test
    public void ThreeSubclasses() {
        runTest(graph -> {
            Node shapeClass = graph.createNode("Shape", EntityType.CLASS, EntityType.ABSTRACT);
            Node circleClass = graph.createNode("Circle", EntityType.CLASS);
            Node rectangleClass = graph.createNode("Rectangle", EntityType.CLASS);
            Node triangleClass = graph.createNode("Triangle", EntityType.CLASS);
            graph.linkTwoNodes(shapeClass, circleClass, RelationType.EXTENDS);
            graph.linkTwoNodes(shapeClass, rectangleClass, RelationType.EXTENDS);
            graph.linkTwoNodes(shapeClass, triangleClass, RelationType.EXTENDS);
            assertEquals(3, graph.getNbClassLevelVariants());
        });
    }

    // TODO: 3/25/19 determine if we should detect a variant or not
    @Test
    public void OneAbstractSubclass() {
        runTest(graph -> {
            Node shapeClass = graph.createNode("Shape", EntityType.CLASS, EntityType.ABSTRACT);
            Node polygonClass = graph.createNode("Polygon", EntityType.CLASS, EntityType.ABSTRACT);
            graph.linkTwoNodes(shapeClass, polygonClass, RelationType.EXTENDS);
            assertEquals(0, graph.getNbClassLevelVariants());
        });
    }
}