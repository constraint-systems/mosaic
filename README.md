# Mosaic

<img
src='https://raw.githubusercontent.com/constraint-systems/mosaic/main/public/mosaic.gif'
width="600"/>

Recreate one image using the tiles from another image.

https://mosaic.constraint.systems

## About the algorithm

The image proccessing works like this:

- reduce each image to a quarter of its original size
- break each reduced size image into 4x4 cells
- for each cell in the DST image, loop through each cell in the SRC image and find the cell that has the closest RGB values for each of its four pixels
- copy and draw the original 16x16 cell from the SRC image in the position of the DST cell

The chosen sizes are pretty much just what I thought would work, trying to balance between accuracy and speed of processing.

The calcuations and image processing are all done using HTML Canvas. Three.js is used to make each canvas zoomable.

A kind of fun result of this method is that different devices (and possibly browsers?) will handle the resizing sampling differently. I get different results on my phone versus my laptop.

## Dev

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
