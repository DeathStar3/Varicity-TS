package fr.unice.i3s.sparks.deathstar3.symfinder.engine.visitors;

import fr.unice.i3s.sparks.deathstar3.symfinder.engine.neo4j_types.EntityType;
import fr.unice.i3s.sparks.deathstar3.symfinder.engine.neo4j_types.RelationType;
import fr.unice.i3s.sparks.deathstar3.symfinder.engine.neograph.NeoGraph;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.eclipse.jdt.core.dom.FieldDeclaration;
import org.eclipse.jdt.core.dom.ITypeBinding;
import org.eclipse.jdt.core.dom.MethodDeclaration;
import org.eclipse.jdt.core.dom.TypeDeclaration;
import org.neo4j.driver.types.Node;

import java.util.Optional;

import static fr.unice.i3s.sparks.deathstar3.symfinder.engine.neo4j_types.EntityAttribute.OUT_OF_SCOPE;

public class ComposeTypeVisitor extends ImportsVisitor {

    private static final Logger logger = LogManager.getLogger(ComposeTypeVisitor.class);

    public ComposeTypeVisitor(NeoGraph neoGraph) {
        super(neoGraph);
    }

    @Override
    public boolean visit(FieldDeclaration field) {
        logger.debug(field);
        ITypeBinding fieldTypeBinding = field.getType().resolveBinding();
        if (field.getParent() instanceof TypeDeclaration && fieldTypeBinding != null) { // prevents the case where the field is an enum, which does not bring variability
            ITypeBinding fieldDeclaringClassBinding = ((TypeDeclaration) field.getParent()).resolveBinding();
            String parentClassName = fieldDeclaringClassBinding.getQualifiedName();
            Optional<String> classFullName = getClassFullName(fieldTypeBinding);
            if (classFullName.isPresent()) {
                Optional<Node> typeNode = neoGraph.getNode(classFullName.get());
                typeNode.ifPresent(node -> {
                    if (!node.hasLabel(OUT_OF_SCOPE.getString())) {
                        Node parentClassNode = neoGraph.getOrCreateNode(parentClassName, fieldDeclaringClassBinding.isInterface() ? EntityType.INTERFACE : EntityType.CLASS);
                        if (!neoGraph.relatedTo(parentClassNode, node)) {
                            neoGraph.linkTwoNodes(parentClassNode, node, RelationType.USAGE);
                        }
                    }
                });
            }
        }
        return false;
    }

    @Override
    public boolean visit(MethodDeclaration method) {
        ITypeBinding declaringClass;
        if (!(method.resolveBinding() == null)) {
            declaringClass = method.resolveBinding().getDeclaringClass();
            ITypeBinding[] typeparameters = method.resolveBinding().getParameterTypes();
            String parentClassName = declaringClass.getQualifiedName();
            Node parentClassNode = neoGraph.getOrCreateNode(parentClassName, declaringClass.isInterface() ? EntityType.INTERFACE : EntityType.CLASS);
            int size = typeparameters.length;

            if (size != 0) {
                for (ITypeBinding typeparameter : typeparameters) {
                    Optional<String> classFullName = getClassFullName(typeparameter);
                    if (classFullName.isPresent()) {
                        Optional<Node> typeNode = neoGraph.getNode(classFullName.get());
                        typeNode.ifPresent(node -> {
                            if (!node.hasLabel(OUT_OF_SCOPE.getString())) {
                                if (!neoGraph.relatedTo(parentClassNode, node)) {
                                    neoGraph.linkTwoNodes(parentClassNode, node, RelationType.USAGE);
                                }
                            }
                        });
                    }
                }
            }
            ananlyzeReturnedTypeOfMethod(method, parentClassNode);
        }
        return false;
    }

    private void ananlyzeReturnedTypeOfMethod(MethodDeclaration methodDeclaration, Node parentClassNode) {
        if (methodDeclaration != null && !methodDeclaration.isConstructor() && methodDeclaration.getReturnType2().resolveBinding() != null && methodDeclaration.resolveBinding() != null) {
            String returnedType = methodDeclaration.getReturnType2().resolveBinding().getQualifiedName();
            Optional<Node> returnedTypeNode = neoGraph.getNode(returnedType);
            returnedTypeNode.ifPresent(node -> {
                if (!node.hasLabel(OUT_OF_SCOPE.getString()) && !node.get("name").asString().equals(parentClassNode.get("name").asString())) {
                    if (!neoGraph.relatedTo(parentClassNode, node)) {
                        neoGraph.linkTwoNodes(parentClassNode, node, RelationType.USAGE);
                    }
                }
            });
        }
    }
}
