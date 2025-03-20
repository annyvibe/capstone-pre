let video;
let bodyPose;
let connections;
let poses = [];
let trails = new Map();
let stopButton, continueButton, replayButton;
let replaying = false;
let replayIndex = 0;

let lastRootPosition = null;
let accumulatedOffset = null;

function preload() {
    bodyPose = ml5.bodyPose("BlazePose");
}

function gotPoses(results) {
    poses = results;
}

function setup() {
    createCanvas(640, 360, WEBGL);
    video = createVideo("assets/test.mp4");
    video.size(640, 360);
    video.loop();

    stopButton = createButton("stop");
    stopButton.position(10, 10);
    stopButton.mousePressed(stopVideo);

    continueButton = createButton("continue");
    continueButton.position(100, 10);
    continueButton.mousePressed(continueVideo);

    replayButton = createButton("Track Replay");
    replayButton.position(200, 10);
    replayButton.mousePressed(replayTrack);

    bodyPose.detectStart(video, gotPoses);
    connections = bodyPose.getSkeleton();

    [15].forEach(index => {
        trails.set(index, []);
    });

    accumulatedOffset = createVector(0, 0, 0);
}

function stopVideo() {
    video.pause();
}

function continueVideo() {
    video.play();
}

function replayTrack() {
    replaying = true;
    replayIndex = 0;
}

function smoothTrail(trail, windowSize) {
    let smoothedTrail = [];
    for (let i = 0; i < trail.length; i++) {
        let sum = createVector(0, 0, 0);
        let count = 0;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(trail.length - 1, i + windowSize); j++) {
            sum.add(trail[j]);
            count++;
        }
        smoothedTrail.push(p5.Vector.div(sum, count));
    }
    return smoothedTrail;
}

function draw() {
    scale(height / 2);
    orbitControl();
    background(0);

    if (poses.length > 0) {
        let pose = poses[0];

        let root = pose.keypoints3D[0];
        if (root.confidence > 0.5) {
            let rootPosition = createVector(root.x, root.y, root.z);

            if (lastRootPosition !== null) {
                let movement = p5.Vector.sub(rootPosition, lastRootPosition);
                accumulatedOffset.add(movement);
            }
            lastRootPosition = rootPosition.copy();

            [15].forEach(index => {
                let keypoint = pose.keypoints3D[index];
                if (keypoint.confidence > 0.5) {
                    let trail = trails.get(index);

                    let worldPosition = createVector(keypoint.x, keypoint.y, keypoint.z);
                    worldPosition.add(accumulatedOffset);

                    trail.push(worldPosition);


                    let smoothedTrail = smoothTrail(trail, 5);

                    strokeWeight(2);
                    noFill();
                    beginShape();

                    if (replaying) {

                        for (let i = 0; i < replayIndex; i++) {
                            let pos = smoothedTrail[i];
                            if (pos) {
                                stroke(255, 150);
                                vertex(pos.x, pos.y, pos.z);
                            }
                        }
                        replayIndex++;
                        if (replayIndex >= smoothedTrail.length) {
                            replaying = false;
                        }
                    } else {

                        smoothedTrail.forEach(pos => {
                            stroke(255, 150);
                            vertex(pos.x, pos.y, pos.z);
                        });
                    }

                    endShape();
                }
            });
        }
    }

    push();
    stroke(150, 50);
    noFill();
    translate(0, 1);
    rotateX(PI / 2);
    plane(3);
    pop();
}

function mousePressed() {
    console.log(poses);
}