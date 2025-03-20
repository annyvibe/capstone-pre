let video;
let bodyPose;
let connections;
let poses = [];
let trails = new Map();
let stopButton, continueButton, replayButton;
let leftHandButton, rightHandButton, leftFootButton, rightFootButton;
let expandButton, shrinkButton;
let replaying = false;
let replayIndex = 0;
let videoExpanded = false; // 是否全屏显示视频

const TRACKED_POINTS = {
    leftHand: 15,
    rightHand: 16,
    leftFoot: 27,
    rightFoot: 28
};

let currentTracking = "leftHand";

function preload() {
    bodyPose = ml5.bodyPose("BlazePose");
}

function gotPoses(results) {
    poses = results;
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL); // 画布全屏
    video = createVideo("assets/test.mp4");
    video.size(320, 180); // 初始小窗口尺寸
    video.position(10, 10);
    video.loop();

    stopButton = createButton("Stop");
    stopButton.position(10, 200);
    stopButton.mousePressed(stopVideo);

    continueButton = createButton("Continue");
    continueButton.position(70, 200);
    continueButton.mousePressed(continueVideo);

    replayButton = createButton("Track Replay");
    replayButton.position(150, 200);
    replayButton.mousePressed(replayTrack);

    leftHandButton = createButton("LH");
    leftHandButton.position(10, 250);
    leftHandButton.mousePressed(() => switchTracking("leftHand"));

    rightHandButton = createButton("RH");
    rightHandButton.position(60, 250);
    rightHandButton.mousePressed(() => switchTracking("rightHand"));

    leftFootButton = createButton("LF");
    leftFootButton.position(110, 250);
    leftFootButton.mousePressed(() => switchTracking("leftFoot"));

    rightFootButton = createButton("RF");
    rightFootButton.position(160, 250);
    rightFootButton.mousePressed(() => switchTracking("rightFoot"));

    expandButton = createButton("Expand Video");
    expandButton.position(10, 300);
    expandButton.mousePressed(expandVideo);

    shrinkButton = createButton("Shrink Video");
    shrinkButton.position(110, 300);
    shrinkButton.mousePressed(shrinkVideo);
    shrinkButton.hide(); // 初始隐藏

    bodyPose.detectStart(video, gotPoses);
    connections = bodyPose.getSkeleton();

    trails.set(TRACKED_POINTS[currentTracking], []);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function switchTracking(part) {
    currentTracking = part;
    trails.clear();
    trails.set(TRACKED_POINTS[currentTracking], []);

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

function expandVideo() {
    video.size(windowWidth, windowHeight);
    video.position(0, 0);
    videoExpanded = true;
    expandButton.hide();
    shrinkButton.show();
}

function shrinkVideo() {
    video.size(320, 180);
    video.position(10, 10);
    videoExpanded = false;
    shrinkButton.hide();
    expandButton.show();
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
    if (!videoExpanded) {
        background(0);
        scale(height / 2);
        orbitControl();

        if (poses.length > 0) {
            let pose = poses[0];

            let index = TRACKED_POINTS[currentTracking];
            let keypoint = pose.keypoints3D[index];

            if (keypoint && keypoint.confidence > 0.5) {
                let trail = trails.get(index);
                let newPos = createVector(keypoint.x, keypoint.y, keypoint.z);

                if (trail.length === 0 || p5.Vector.dist(trail[trail.length - 1], newPos) > 0.01) {
                    trail.push(newPos);
                }
            }
        }

        trails.forEach((trail, index) => {
            let smoothedTrail = smoothTrail(trail, 5);

            strokeWeight(2);
            noFill();
            beginShape();

            if (replaying) {
                if (replayIndex < smoothedTrail.length) {
                    for (let i = 0; i <= replayIndex; i++) {
                        let pos = smoothedTrail[i];
                        stroke(255, 150);
                        vertex(pos.x, pos.y, pos.z);
                    }
                    replayIndex++;
                } else {
                    replaying = false;
                    console.log("Replay finished!");
                }
            } else {
                smoothedTrail.forEach(pos => {
                    stroke(255, 150);
                    vertex(pos.x, pos.y, pos.z);
                });
            }

            endShape();
        });

        push();
        stroke(150, 50);
        noFill();
        translate(0, 1);
        rotateX(PI / 2);
        plane(3);
        pop();
    }
}

function mousePressed() {
    console.log(poses);
}