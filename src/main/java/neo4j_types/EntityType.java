package neo4j_types;

public enum EntityType implements NodeType {
    CLASS, METHOD, CONSTRUCTOR, INTERFACE;

    @Override
    public String getString() {
        return this.toString();
    }
}