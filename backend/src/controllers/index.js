const authController = require('./authController');
const userController = require('./userController');
const projectController = require('./projectController');
const taskController = require('./taskController');
const dashboardController = require('./dashboardController');

module.exports = {
  ...authController,
  ...userController,
  ...projectController,
  ...taskController,
  ...dashboardController,
};
