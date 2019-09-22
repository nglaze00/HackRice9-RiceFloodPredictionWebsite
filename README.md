# HackRice9-RiceFloodPredictionWebsite

## Description
Website for the "Put it in Rice" project.
Allows user to do the following:
 * Identify which major Rice University campus locations may be flooded via a map and colored icons (waters level given by combined user input or predicted using historical data and current weather conditions)
 * Report flood levels at these locations
 * Generate a dry path from one campus location to another
This is all accomplished via API connection to a Python Flask server, which stores the data on a Google Cloud-hosted MongoDB cluster.
 
## Future goals
 * Historical data slider