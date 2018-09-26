# PolarViz
PolarViz, a radial distortion strategy based on RadViz plot[[1]](https://ieeexplore.ieee.org/document/663916), proposed by the authors to visualize high-dimensional dataset [[2]](https://dl.acm.org/citation.cfm?id=3095155)[[3]](https://link.springer.com/article/10.1007/s00371-018-1558-y). The user can customize the radial distribution of data points in RadViz plot by operations on a related histogram plot. This program is in JavaScript and only depend on [d3.js library](https://github.com/d3). 

To be honest, this is my first github project and even the first JavaScript project. Though the code works well in the demo, I cannot guarantee the performance on any scenarios. I will keep modifying this code.

If this work makes any contribution to your own work, I would be very happy. If you think your work has any relationship with PolarViz and would like to cite this work, thanks. For your convenience, I provide the Latex BibTex of this work.
```
@inproceedings{wang2017histogram,
  title={Histogram equalization and specification for high-dimensional data visualization using RadViz},
  author={Wang, Yan-Chao and Zhang, Qian and Lin, Feng and Goh, Chi-Keong and Wang, Xuan and Seah, Hock-Soon},
  booktitle={Proceedings of the Computer Graphics International Conference},
  pages={15},
  year={2017},
  organization={ACM}
}

@article{wang2018polarviz,
  title={PolarViz: a discriminating visualization and visual analytics tool for high-dimensional data},
  author={Wang, Yan Chao and Zhang, Qian and Lin, Feng and Goh, Chi Keong and Seah, Hock Soon},
  journal={The Visual Computer},
  pages={1--16},
  year={2018},
  publisher={Springer}
}
```

# About the Code
* 'Index.html' defines the DOM components used in the PolarViz function.
* 'Index.js' loads the high-dimensional dataset, defines the five variables used in the PolarViz function, and calls the PolarViz function.
* 'PolarViz.js' defines the PolarViz function.
* In the data file, I use the 'IRIS' dataset as an example to call the PolarViz function.
