// frontend http server
package main

import (
	"flag"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/jcelliott/lumber"
	"net/http"
	"os"
)

var (
	// populated at build time by grunt.
	version     = "@@version"
	projectName = "@@project_name"

	// http server flags
	httpAddress  = flag.String("httpaddress", "", "ip address for the http server.")
	httpPort     = flag.Int("httpport", 8080, "port for the http server.")
	staticRoot   = flag.String("staticroot", "./static", "root dir for static resources.")
	templateRoot = flag.String("templateroot", "./templates", "root dir for templates.")

	// logging flags
	logFile          = flag.String("logfile", ".@@project_name.log", "path to log file.")
	logLevel         = flag.String("loglevel", "INFO", "Log level for console logging. One of (TRACE|DEBUG|INFO|WARN|ERROR|FATAL).")
	alsoLogToConsole = flag.Bool("alsologtoconsole", false, "Also log to console in addition to log files.")

	// globals
	log *lumber.MultiLogger // global Logger
)

func IndexHandler(rw http.ResponseWriter, req *http.Request) {
	http.ServeFile(rw, req, *templateRoot+"/index.html")
}

func main() {
	// Parse flags
	flag.Parse()

	// Setup logging
	log_file, err := lumber.NewRotateLogger(*logFile, 5000, 4)
	if err != nil {
		fmt.Printf("Unable to open log file - %s\n", err.Error())
		os.Exit(1)
	}
	level_int := lumber.LvlInt(*logLevel)
	log = lumber.NewMultiLogger()
	log.AddLoggers(log_file)
	if *alsoLogToConsole {
		log_console := lumber.NewConsoleLogger(level_int)
		log.AddLoggers(log_console)
	}
	log.Level(level_int)
	defer log.Close()

	log.Info("%s frontend v%v", projectName, version)

	// Routing
	router := mux.NewRouter()
	router.HandleFunc("/", IndexHandler)

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(*staticRoot))))
	http.Handle("/", router)
	log.Debug("initialized routing")

	// Start Http Server.
	addr := fmt.Sprintf("%s:%d", *httpAddress, *httpPort)
	log.Info("Listening on %s", addr)
	http.ListenAndServe(addr, nil)
}
