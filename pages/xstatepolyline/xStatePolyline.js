import Konva from "konva";
import { setup, createActor } from "xstate";

const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline; // La polyline en cours de construction

const polylineMachine = setup({
    // Quelques actions et gardes que vous pouvez utiliser dans votre machine
    actions: {
        // Créer une nouvelle polyline
        createLine: () => {
            const pos = stage.getPointerPosition();
            polyline = new Konva.Line({
                points: [pos.x, pos.y, pos.x, pos.y],
                stroke: "red",
                strokeWidth: 2,
            });
            layer.add(polyline);
        },
        // Mettre à jour le dernier point (provisoire) de la polyline
        setLastPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;

            const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
            polyline.points(newPoints.concat([pos.x, pos.y]));
            layer.batchDraw();
        },
        // Enregistrer la polyline
        saveLine: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            // Le dernier point(provisoire) ne fait pas partie de la polyline
            const newPoints = currentPoints.slice(0, size - 2);
            polyline.points(newPoints);
            layer.batchDraw();
        },
        // Ajouter un point à la polyline
        addPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
            polyline.points(newPoints); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
        // Abandonner le tracé de la polyline
        abandon: () => {
            // Supprimer la variable polyline :
            polyline.remove();
layer.batchDraw();
        },
        // Supprimer le dernier point de la polyline
        removeLastPoint: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
            const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
            polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
    },
    guards: {
        // On peut encore ajouter un point
        pasPlein: () => {
            // Retourner vrai si la polyline a moins de 10 points
            // attention : dans le tableau de points, chaque point est représenté par 2 valeurs (coordonnées x et y)
           return polyline.points().length < MAX_POINTS * 2; 
        },
        // On peut enlever un point
        plusDeDeuxPoints: () => {
            // Deux coordonnées pour chaque point, plus le point provisoire
            return polyline.points().length > 6;
        },
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAIwA2AKxFFATm2aAzMr5qA7GoAcAGhCZEpgExFVAFh2q+t24qOrNqgL6-LNCw8QiIaQgAFVAJxanpmNk5eQVk0MUlpWQUERyNFIkdbPl1VVVM+H1VlR0dLawQ7B2dtV3dPbz8AkCCcAmJwsCiYuMYmWgA1Jn4hJG7RCSkZWeyVdUddRVt9cqrlXVNaq0QAWjyHZRVFS70+E2V-QIxe0IGh-FimWABjAENkMGmqXmGSWoGyuiMfCIpjKbluRlMin2NTqJ0UVSICMcql0hR8yi8Tgec2CfSIAFsfvhMG9xLARswJlMUrM0gtMstEM4oVsirlHHZtO5DvVjpsjAVNActqpbM4DqojMSeiFiJTqbT6Z9fv9AazgYssog9ppoYZTJoCZ5DHLUQgxfkdo49rY8qYDMofMqnqqKVSadF3lr3mAAE56kTpQ2chruTHrPimRGepNGTR246NMq2aq44qadEE72k0LqgMxem0UaJbgRuZRjlgxCQqHKAylTa6Ep8FR22ylIgGIw52Wwzzo4vPNX+zUM1gcWuKGaR9mg+SIAv2PSaAWGJx8HuqO26Ihy-a6CpImGj0qT31l2cAIR+XwA1rBkC+ASyVyCjQgc1MIhbmKZRbAtLZchMPstAcIw7gtW5dFdPhOkeEtpw1QM6QoZ83w-L8eCXIEGzXbJ3XyOUBXKRMBVdY9VHyZC3ClUwjA2Mo238Lp8FQCA4CBDCSNXf9jmUDMqOAhVdB8C10WcO8yVIchhL-GNCjtRFTx0S0kTPAVFEUl5Imw1ToybBBcWUIhcRxKpE2qLQjyOBpKJ05CIPaXQjMw8sgzMxt1wQBET0Yg8LkUVC2w2O1LQ0RxigRC5nGzUxuN8IA */
    id: "polyLine",
    initial: "idle",
    states: {
        idle: {
            on: {
                MOUSECLICK: {
                    target: "OnePoint",
                    actions: "createLine"
                }
            }
        },

        OnePoint: {
            on: {
                MOUSECLICK: {
                    target: "manyPoints",
                    actions: "addPoint"
                },

                MOUSEMOVE: {
                    target: "OnePoint",
                    actions: "setLastPoint"
                },

                Escape: {
                    target: "idle",
                    actions: "abandon"
                }
            }
        },

        manyPoints: {
            on: {
                MOUSEMOVE: {
                    target: "manyPoints",
                    actions: "setLastPoint"
                },

                Escape: {
                    target: "idle",
                    actions: "abandon"
                },

                Enter: {
                    target: "idle",
                    actions: "saveLine"
                },

                MOUSECLICK: [{
                    target: "manyPoints",
                    actions: "addPoint",
                    guard: "pasPlein"
                }, {
                    target: "idle",
                    actions: ["addPoint", "saveLine"]
                }],

                Backspace: [{
                    target: "manyPoints",
                    actions: "removeLastPoint",
                    guard: "plusDeDeuxPoints"
                }, {
                    target: "OnePoint",
                    actions: "removeLastPoint"
                }]
            }
        }
    },
});

// On démarre la machine
const polylineActor = createActor(polylineMachine);
polylineActor.subscribe((snapshot) => {
    console.log("Current state:", snapshot.value);
});
polylineActor.start();

// On envoie les événements à la machine
stage.on("click", () => {
    polylineActor.send({ type: "MOUSECLICK" });
});

stage.on("mousemove", () => {
    polylineActor.send({ type: "MOUSEMOVE" });
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineActor.send({ type: event.key });
});
