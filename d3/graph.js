import {NodesFilter} from "./nodes-filter.js";

class Graph {
//	data stores
    graph;
    store;

    width;
    height;

    filterIsolated = false;
    jsonFile;
    jsonStatsFile;

    firstTime = true;

    filter;

    svg; g; link; node; label;

    //	d3 color scales
    color = d3.scaleLinear()
        .range(["#FFFFFF", '#FF0000'])
        .interpolate(d3.interpolateRgb);

    constructor(jsonFile, jsonStatsFile, nodeFilters) {
        this.filter = new NodesFilter("#add-filter-button", "#package-to-filter", "#list-tab", nodeFilters, () => this.displayGraph());
        this.jsonFile = jsonFile;
        this.jsonStatsFile = jsonStatsFile;
    }


    async displayGraph() {
        d3.selectAll("svg > *").remove();
        if (this.firstTime) {
            sessionStorage.setItem("filtered", "false");
            this.filter.appendFiltersToTab();
            this.firstTime = false;
        }
        this.filterIsolated = sessionStorage.getItem("filtered") === "true";
        await this.generateGraph();
    }

    async generateGraph() {

        this.width = window.innerWidth;
        this.height = window.innerHeight - 10;

        this.generateStructure(this.width, this.height);

        await this.getData(this);

     }

    generateStructure(width, height) {
        //	svg selection and sizing
        this.svg = d3.select("svg").attr("width", width).attr("height", height);

        this.svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", -5)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0L10,-5L10,5")
            .attr('fill', 'gray')
            .style('stroke', 'none');


        //add encompassing group for the zoom
        this.g = this.svg.append("g")
            .attr("class", "everything");

        this.link = this.g.append("g").selectAll(".link");
        this.node = this.g.append("g").selectAll(".node");
        this.label = this.g.append("g").selectAll(".label");
    }

    async getData(graph) {
        return new Promise((resolve, reject) => {
            d3.queue()
                .defer(d3.json, graph.jsonFile)
                .defer(d3.json, graph.jsonStatsFile)
                .await((err, gr, stats) => {
                    if (err) throw err;
                    graph.displayData(err, gr, stats);
                    graph.update(this.node, this.link, this.label);
                    resolve();
                });
        });

    }

    displayData(err, gr, stats) {
        //	data read and store

        if (err) throw err;

        document.getElementById("statistics").innerHTML =
            // "Number of VPs: " + stats["VPs"] + "<br>" +
            // "Number of methods VPs: " + stats["methodVPs"] + "<br>" +
            // "Number of constructors VPs: " + stats["constructorsVPs"] + "<br>" +
            "Number of class level VPs: " + stats["classLevelVPs"] + "<br>" +
            "Number of method level VPs: " + stats["methodLevelVPs"] + "<br>" +
            // "Number of variants: " + stats["variants"] + "<br>" +
            // "Number of methods variants: " + stats["methodsVariants"] + "<br>" +
            // "Number of constructors variants: " + stats["constructorsVariants"] + "<br>" +
            "Number of class level variants: " + stats["classLevelVariants"] + "<br>" +
            "Number of method level variants: " + stats["methodLevelVariants"];

        var sort = gr.nodes.filter(a => a.types.includes("CLASS")).map(a => parseInt(a.constructorVariants)).sort((a, b) => a - b);
        this.color.domain([sort[0] - 3, sort[sort.length - 1]]); // TODO deal with magic number

        var nodeByID = {};

        this.graph = gr;
        this.store = $.extend(true, {}, gr);

        this.graph.nodes.forEach(function (n) {
            n.radius = n.types.includes("CLASS") ? 10 + n.methodVPs : 10;
            nodeByID[n.name] = n;
        });

        this.graph.links.forEach(function (l) {
            l.sourceTypes = nodeByID[l.source].types;
            l.targetTypes = nodeByID[l.target].types;
        });

        this.store.nodes.forEach(function (n) {
            n.radius = n.types.includes("CLASS") ? 10 + n.methodVPs : 10;
        });

        this.store.links.forEach(function (l) {
            l.sourceTypes = nodeByID[l.source].types;
            l.targetTypes = nodeByID[l.target].types;
        });


        this.graph.nodes = this.filter.getNodesListWithoutMatchingFilter(gr.nodes);
        this.graph.links = this.filter.getLinksListWithoutMatchingFilter(gr.links);

        if (this.filterIsolated) {
            var nodesToKeep = new Set();
            this.graph.links.forEach(l => {
                nodesToKeep.add(l.source);
                nodesToKeep.add(l.target);
            });
            this.graph.nodes = gr.nodes.filter(n => nodesToKeep.has(n.name));
        }

    }


    //	general update pattern for updating the graph
    update(node, link, label) {

        //	UPDATE
        node = node.data(this.graph.nodes, function (d) {
            return d.name;
        });
        //	EXIT
        node.exit().remove();
        //	ENTER
        var newNode = node.enter().append("circle")
            .attr("class", "node")
            .style("stroke-dasharray", function (d) {
                return d.types.includes("ABSTRACT") ? "3,3" : "3,0"
            })
            .style("stroke", "black")
            .style("stroke-width", function (d) {
                return d.types.includes("ABSTRACT") ? d.classVariants + 1 : d.classVariants;
            })
            .attr("r", function (d) {
                return d.radius
            })
            .attr("fill", (d) => {
                return d.types.includes("INTERFACE") ? d3.rgb(0, 0, 0) : d3.rgb(this.color(d.constructorVariants))
            })
            .attr("name", function (d) {
                return d.name
            });

        newNode.append("title").text(function (d) {
            return "types: " + d.types + "\n" + "name: " + d.name;
        });

        //	ENTER + UPDATE
        node = node.merge(newNode);

        //	UPDATE
        link = link.data(this.graph.links, function (d) {
            return d.name;
        });
        //	EXIT
        link.exit().remove();
        //	ENTER
        var newLink = link.enter().append("line")
            .attr("stroke-width", 1)
            .attr("class", "link")
            .attr("source", d => d.source)
            .attr("target", d => d.target)
            .attr('marker-start', "url(#arrowhead)")
            .style("pointer-events", "none");

        newLink.append("title")
            .text(function (d) {
                return "source: " + d.source + "\n" + "target: " + d.target;
            });
        //	ENTER + UPDATE
        link = link.merge(newLink);

        //  UPDATE
        label = label.data(this.graph.nodes, function (d) {
            return d.name;
        });
        //	EXIT
        label.exit().remove();
        //  ENTER
        var newLabel = label.enter().append("text")
            .attr("dx", -5)
            .attr("dy", ".35em")
            .attr("name", d => d.name)
            .attr("fill", (d) => {
                var nodeColor = d.types.includes("INTERFACE") ? d3.rgb(0, 0, 0) : d3.rgb(this.color(d.constructorVariants));
                return contrastColor(nodeColor);
            })
            .text(function (d) {
                return ["STRATEGY", "FACTORY", "TEMPLATE", "DECORATOR"].filter(p => d.types.includes(p)).map(p => p[0]).join(", ");
            });

        //	ENTER + UPDATE
        label = label.merge(newLabel);

        // d3.selectAll("circle.node").on("click", () => {
        //     this.filter.addFilter(d3.select(this).attr("name"), );
        // });

        this.addAdvancedBehaviour(newNode, this.width, this.height, this.g, this.svg, node, link, label);
    }

    addAdvancedBehaviour(newNode, width, height, g, svg, node, link, label) {
        newNode.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

        //	force simulation initialization
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance(100)
                .id(function (d) {
                    return d.name;
                }))
            .force("charge", d3.forceManyBody()
                .strength(function (d) {
                    return -50;
                }))
            .force("center", d3.forceCenter(width / 2, height / 2));


        //	update simulation nodes, links, and alpha
        simulation
            .nodes(this.graph.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(this.graph.links);

        simulation.alpha(1).alphaTarget(0).restart();

        //add zoom capabilities
        var zoom_handler = d3.zoom()
            .on("zoom", () => g.attr("transform", d3.event.transform));

        zoom_handler(svg);

        //	drag event handlers
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        //	tick event handler with bounded box
        function ticked() {
            node
            // .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
            // .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });

            link
                .attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            label
                .attr("x", function (d) {
                    return d.x;
                })
                .attr("y", function (d) {
                    return d.y;
                });
        }
    }
}

function contrastColor(color) {
    var d = 0;

    // Counting the perceptive luminance - human eye favors green color...
    const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;

    if (luminance > 0.5)
        d = 0; // bright colors - black font
    else
        d = 255; // dark colors - white font

    return d3.rgb(d, d, d);
}

$(document).on('click', ".list-group-item", function (e) {
    e.preventDefault();
    $('.active').removeClass('active');
});

$("#add-package-button").on('click', async function (e) {
    e.preventDefault();
    let input = $("#package-to-color");
    let inputValue = input.val();
    input.val("");
    await addFilter(inputValue, "#color-tab", () => coloredPackages.set(inputValue, "blue"));
});

$("#filter-isolated").on('click', async function (e) {
    e.preventDefault();
    var previouslyFiltered = sessionStorage.getItem("filtered") === "true";
    sessionStorage.setItem("filtered", previouslyFiltered ? "false" : "true");
    $(this).text(previouslyFiltered ? "Unfilter isolated nodes" : "NodesFilter isolated nodes");
    await displayGraph(this.jsonFile, this.jsonStatsFile, this.filter.filtersList);
});

$('#hide-info-button').click(function () {
    $(this).text(function (i, old) {
        return old === 'Show project information' ? 'Hide project information' : 'Show project information';
    });
});

$('#hide-legend-button').click(function () {
    $(this).text(function (i, old) {
        return old === 'Hide legend' ? 'Show legend' : 'Hide legend';
    });
});


export { Graph };