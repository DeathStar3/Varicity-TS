package fr.unice.i3s.sparks.deathstar3.symfinder.engine.neo4j_types;

public enum EntityVisibility implements NodeType {
    PUBLIC, PRIVATE;

    @Override
    public String getString() {
        return this.toString();
    }
}