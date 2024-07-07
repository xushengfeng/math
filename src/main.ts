/// <reference types="vite/client" />
import { el } from "redom";
import * as echarts from "echarts/core";
import { TitleComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { GraphChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([TitleComponent, TooltipComponent, LegendComponent, GraphChart, CanvasRenderer]);

const main = el("div") as HTMLElement;
document.body.append(main);
main.style.width = "800px";
main.style.height = "600px";

var myChart = echarts.init(main, "dark");

import rawData from "../data/data.json?raw";
const data = JSON.parse(rawData) as { [key: string]: string[] };

const nodeSet: Set<string> = new Set();
for (let i in data) {
    nodeSet.add(i);
    for (let f of data[i]) {
        nodeSet.add(f);
    }
}

const nodes = Array.from(nodeSet);

const edge: { source: string; target: string }[] = [];
for (let i in data) {
    for (let f of data[i]) {
        edge.push({ source: f, target: i });
    }
}

const categories: string[] = Array.from(new Set(nodes.map((i) => i.split(".")[0])));

console.log(categories);

const g = Object.groupBy(nodes, (i) => i.split(".")[0]);
console.log(g);
const c: { [k: string]: { y: number; color: string } } = {
    Algebra: { y: 0.4, color: "#ffff00" },
    Data: { y: 0.5, color: "#404040" },
    RingTheory: { y: 0.3, color: "#ff8000" },
    Order: { y: 0.5, color: "#804000" },
    LinearAlgebra: { y: 0.55, color: "#00ff00" },
    Init: { y: 0.5, color: "#008040" },
    Control: { y: 0, color: null }, // Assuming Control does not have a specified color
    Logic: { y: 0.6, color: "#0080ff" },
    NumberTheory: { y: 0.5, color: "#800000" },
    GroupTheory: { y: 0.2, color: "#ff2040" },
    SetTheory: { y: 0.6, color: "#ff8080" },
    AlgebraicGeometry: { y: 0.6, color: "#6040ff" },
    CategoryTheory: { y: 0.7, color: "#80a0ff" },
    Geometry: { y: 0.65, color: "#ff80ff" },
    Topology: { y: 0.85, color: "#ff00ff" },
    AlgebraicTopology: { y: 0.8, color: "#6040ff" }, // Using the same color as AlgebraicGeometry
    Analysis: { y: 0.75, color: "#00ffff" },
    MeasureTheory: { y: 0.9, color: "#8000ff" },
    Combinatorics: { y: 0.1, color: "#800000" },
    Computability: { y: 0.65, color: "#bfff00" },
    Condensed: { y: 0.8, color: "#ff0000" },
    Dynamics: { y: 1, color: "#008040" },
    FieldTheory: { y: 0.2, color: "#ffff80" },
    InformationTheory: { y: 0.1, color: "#8000ff" },
    ModelTheory: { y: 0.35, color: "#6040ff" },
    Probability: { y: 1, color: "#0000ff" },
    RepresentationTheory: { y: 0.35, color: "#ff0000" },
};

function topologicalSort(graph: { [k: string]: string[] }) {
    const visited = new Set();
    const stack: string[] = [];

    function dfs(node: string) {
        visited.add(node);
        if (graph[node]) {
            for (let neighbor of graph[node]) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor);
                }
            }
        }
        stack.unshift(node);
    }

    // Perform DFS for each unvisited node
    for (let node in graph) {
        if (!visited.has(node)) {
            dfs(node);
        }
    }

    return stack;
}

function countDegrees(graph) {
    const indegree = {};
    const outdegree = {};

    // Initialize degrees
    for (let node in graph) {
        if (!(node in indegree)) {
            indegree[node] = 0;
        }
        if (!(node in outdegree)) {
            outdegree[node] = 0;
        }
        for (let neighbor of graph[node]) {
            if (!(neighbor in indegree)) {
                indegree[neighbor] = 0;
            }
            if (!(neighbor in outdegree)) {
                outdegree[neighbor] = 0;
            }
            // Increment outdegree for node and indegree for neighbor
            outdegree[node]++;
            indegree[neighbor]++;
        }
    }

    return { outdegree, indegree };
}

const { outdegree, indegree } = countDegrees(data);

const nodesss = topologicalSort(data).reverse();

const n = nodes.map((i) => {
    const x = i.split(".")[0];
    const v = outdegree[i] + indegree[i];
    return {
        id: i,
        name: i,
        symbolSize: 1 * v,
        value: v,
        x: (nodesss.indexOf(i) / nodesss.length) * 800,
        y: c[x].y * 600 + v * Math.random(),
        category: categories.indexOf(x),
    };
});

myChart.showLoading();

function show(lan: string) {
    fetch(`./lan/${lan}.json`)
        .then((i) => i.json())
        .then((j) => {
            n.forEach(
                (i) =>
                    (i.name =
                        j[i.name] ||
                        i.name
                            .split(".")
                            .map((x) => j[x] || x)
                            .join(".") ||
                        i.name)
            );

            showChart();
        });
}

function showChart() {
    myChart.hideLoading();
    myChart.setOption(
        {
            backgroundColor: "#000",
            legend: [
                {
                    type: "scroll",
                    data: categories,
                    left: 0,
                    bottom: 0,
                },
            ],
            series: [
                {
                    type: "graph",
                    layout: "none",
                    symbol: "circle",
                    data: n,
                    links: edge,
                    categories: categories.map((i) => {
                        const color = c[i].color || "#000";
                        return {
                            name: i,
                            itemStyle: {
                                color: color,
                                shadowColor: color,
                                shadowBlur: 5,
                            },
                        };
                    }),
                    label: {
                        show: true,
                        position: "right",
                        formatter: "{b}",
                        textBorderColor: "none",
                    },
                    roam: true,
                    labelLayout: {
                        hideOverlap: true,
                    },
                    scaleLimit: {
                        min: 0.4,
                    },
                    lineStyle: {
                        color: "source",
                        opacity: 0.5,
                        curveness: 0.1,
                        width: 0.5,
                    },
                },
            ],
        },
        true
    );
}

function jumpToID(id: string) {
    const { x, y } = n.find((i) => i.id === id);
    const op = myChart.getOption();
    op["series"][0].center = [x, y];
    myChart.setOption(op, true);
}

show("zh-HANS");

myChart.on("click", (e) => {
    if (e.dataType === "node") showWiki(e.data["id"]);
});

const wikiEl = el("div");
document.body.append(wikiEl);

function showWiki(id: string) {
    const name = n.find((i) => i.id === id).name;
    const from = data[id];
    const to: string[] = [];
    for (let i in data) {
        if (data[i].includes(id)) {
            to.push(i);
        }
    }

    wikiEl.innerText = "";
    wikiEl.append(el("h2", name), el("p", id));

    const fromEl = el("ul");
    const toEl = el("ul");
    for (let i of from) {
        fromEl.append(el("li", i, { onclick: () => jumpToID(i) }));
    }
    for (let i of to) {
        toEl.append(el("li", i, { onclick: () => jumpToID(i) }));
    }

    wikiEl.append(fromEl, toEl);
}
